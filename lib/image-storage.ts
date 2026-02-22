/**
 * @fileoverview Image storage utilities for downloading and uploading images
 * Downloads images from temporary URLs and uploads to permanent Supabase Storage
 */

import { supabaseAdmin } from './supabase';
import { BriefImages } from './types';
import type { MagazineImageGenerationResult } from './image-generator';

/**
 * Downloads an image from a URL and returns as a Blob
 */
async function downloadImage(url: string): Promise<Blob> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }

  return await response.blob();
}

/**
 * Uploads an image blob to Supabase Storage and returns the public URL
 */
export async function uploadImageToStorage(
  imageBlob: Blob,
  fileName: string,
  bucketName: string = 'brief-images'
): Promise<string> {
  try {
    // Upload to Supabase Storage (using admin client for full permissions)
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, imageBlob, {
        contentType: imageBlob.type,
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
}

/**
 * Downloads image from temporary URL and uploads to permanent storage
 * Returns the permanent public URL
 */
export async function saveImagePermanently(
  temporaryUrl: string,
  briefId: string,
  imageType: string // e.g., 'avatar_primary', 'section_brand_truth'
): Promise<string> {
  try {
    // Skip empty URLs (commented out pages)
    if (!temporaryUrl || temporaryUrl.trim() === '') {
      console.log(`[Storage] Skipping empty URL for ${imageType}`);
      return '';
    }

    console.log(`[Storage] Downloading image from temporary URL...`);

    // Download image from temporary URL
    const imageBlob = await downloadImage(temporaryUrl);

    // Generate unique filename with YYYYMMDD-HH-MM-SS timestamp
    const now = new Date();
    const timestamp =
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') +
      '-' +
      now.getHours().toString().padStart(2, '0') +
      '-' +
      now.getMinutes().toString().padStart(2, '0') +
      '-' +
      now.getSeconds().toString().padStart(2, '0');
    const extension = imageBlob.type.split('/')[1] || 'png';
    const fileName = `${briefId}/${imageType}_${timestamp}.${extension}`;

    console.log(`[Storage] Uploading to Supabase Storage: ${fileName}`);

    // Upload to permanent storage
    const permanentUrl = await uploadImageToStorage(imageBlob, fileName);

    console.log(`[Storage] ✅ Image saved permanently: ${permanentUrl}`);

    return permanentUrl;
  } catch (error) {
    console.error('[Storage] Error saving image:', error);
    throw error;
  }
}

/**
 * Saves all brief images to permanent storage
 * Takes temporary URLs, downloads and uploads them, returns permanent URLs
 */
export async function saveAllBriefImages(
  briefId: string,
  tempImages: {
    avatars: [string, string, string];
    sections: {
      brandTruth: string;
      marketContext: string;
      problem: string;
      transformation: string;
      proofPillars: string;
    };
  }
): Promise<typeof tempImages> {
  try {
    console.log(`[Storage] Saving all images for brief ${briefId}...`);

    // Save all images in parallel for speed
    const [avatar1, avatar2, avatar3, brandTruth, marketContext, problem, transformation, proofPillars] =
      await Promise.all([
        saveImagePermanently(tempImages.avatars[0], briefId, 'avatar_primary'),
        saveImagePermanently(tempImages.avatars[1], briefId, 'avatar_secondary'),
        saveImagePermanently(tempImages.avatars[2], briefId, 'avatar_tertiary'),
        saveImagePermanently(tempImages.sections.brandTruth, briefId, 'section_brand_truth'),
        saveImagePermanently(tempImages.sections.marketContext, briefId, 'section_market_context'),
        saveImagePermanently(tempImages.sections.problem, briefId, 'section_problem'),
        saveImagePermanently(tempImages.sections.transformation, briefId, 'section_transformation'),
        saveImagePermanently(tempImages.sections.proofPillars, briefId, 'section_proof_pillars'),
      ]);

    const permanentImages = {
      avatars: [avatar1, avatar2, avatar3] as [string, string, string],
      sections: {
        brandTruth,
        marketContext,
        problem,
        transformation,
        proofPillars,
      },
    };

    console.log(`[Storage] ✅ All 8 images saved permanently`);

    return permanentImages;
  } catch (error) {
    console.error('[Storage] Error saving images:', error);
    throw error;
  }
}

/**
 * Deletes all images for a brief from storage
 */
export async function deleteBriefImages(
  briefId: string,
  bucketName: string = 'brief-images'
): Promise<void> {
  try {
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from(bucketName)
      .list(briefId);

    if (listError) {
      throw listError;
    }

    if (files && files.length > 0) {
      const filePaths = files.map(file => `${briefId}/${file.name}`);

      const { error: deleteError } = await supabaseAdmin.storage
        .from(bucketName)
        .remove(filePaths);

      if (deleteError) {
        throw deleteError;
      }

      console.log(`[Storage] ✅ Deleted ${files.length} images for brief ${briefId}`);
    }
  } catch (error) {
    console.error('[Storage] Error deleting images:', error);
    throw error;
  }
}

/**
 * Saves all magazine images to permanent storage (13 images total)
 * Downloads from temporary NanoBanana URLs and uploads to Supabase Storage
 */
export async function saveMagazineImages(
  briefId: string,
  tempImages: MagazineImageGenerationResult
): Promise<BriefImages> {
  try {
    console.log(`[Storage] Saving all magazine images for brief ${briefId}...`);

    // Save all 13 images in parallel for speed
    const [
      avatar1, avatar2, avatar3,
      cover,
      brandTruth, marketContext, problem, transformation,
      proofPillars, offer, messaging, creativeDirection,
      backCover
    ] = await Promise.all([
      // Avatar references
      saveImagePermanently(tempImages.avatars[0], briefId, 'avatar_primary'),
      saveImagePermanently(tempImages.avatars[1], briefId, 'avatar_secondary'),
      saveImagePermanently(tempImages.avatars[2], briefId, 'avatar_tertiary'),
      // Cover
      saveImagePermanently(tempImages.cover, briefId, 'page_cover'),
      // Section pages
      saveImagePermanently(tempImages.pages.brandTruth, briefId, 'page_brand_truth'),
      saveImagePermanently(tempImages.pages.marketContext, briefId, 'page_market_context'),
      saveImagePermanently(tempImages.pages.problem, briefId, 'page_problem'),
      saveImagePermanently(tempImages.pages.transformation, briefId, 'page_transformation'),
      saveImagePermanently(tempImages.pages.proofPillars, briefId, 'page_proof_pillars'),
      saveImagePermanently(tempImages.pages.offer, briefId, 'page_offer'),
      saveImagePermanently(tempImages.pages.messaging, briefId, 'page_messaging'),
      saveImagePermanently(tempImages.pages.creativeDirection, briefId, 'page_creative_direction'),
      // Back cover
      saveImagePermanently(tempImages.backCover, briefId, 'page_back_cover'),
    ]);

    const permanentImages: BriefImages = {
      cover,
      avatars: [avatar1, avatar2, avatar3],
      pages: {
        brandTruth,
        marketContext,
        problem,
        transformation,
        proofPillars,
        offer,
        messaging,
        creativeDirection,
      },
      backCover,
    };

    console.log(`[Storage] ✅ All 13 magazine images saved permanently`);

    return permanentImages;
  } catch (error) {
    console.error('[Storage] Error saving magazine images:', error);
    throw error;
  }
}
