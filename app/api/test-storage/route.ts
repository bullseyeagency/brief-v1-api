import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';

/**
 * Test endpoint to verify Supabase Storage is configured correctly
 * GET /api/test-storage
 */
export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: {},
  };

  try {
    // Test 1: Check if bucket exists
    console.log('[Storage Test] Checking if brief-images bucket exists...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      results.tests.bucketList = {
        status: 'error',
        error: bucketsError.message,
      };
      return NextResponse.json(results, { status: 500 });
    }

    const briefImagesBucket = buckets?.find(b => b.name === 'brief-images');

    results.tests.bucketExists = {
      status: briefImagesBucket ? 'pass' : 'fail',
      bucket: briefImagesBucket || null,
      message: briefImagesBucket
        ? 'Bucket "brief-images" exists'
        : 'Bucket "brief-images" NOT FOUND - you need to create it',
    };

    if (!briefImagesBucket) {
      results.summary = 'Bucket not found. Create "brief-images" bucket in Supabase dashboard.';
      return NextResponse.json(results, { status: 404 });
    }

    // Test 2: Check if bucket is public
    results.tests.bucketPublic = {
      status: briefImagesBucket.public ? 'pass' : 'warning',
      isPublic: briefImagesBucket.public,
      message: briefImagesBucket.public
        ? 'Bucket is public (good!)'
        : 'Bucket is private - images may not be publicly accessible',
    };

    // Test 3: Try to list files in bucket
    console.log('[Storage Test] Listing files in bucket...');
    const { data: files, error: listError } = await supabase.storage
      .from('brief-images')
      .list('', { limit: 10 });

    if (listError) {
      results.tests.bucketAccess = {
        status: 'error',
        error: listError.message,
        message: 'Cannot access bucket - check permissions',
      };
    } else {
      results.tests.bucketAccess = {
        status: 'pass',
        fileCount: files?.length || 0,
        files: files?.slice(0, 5).map(f => f.name) || [],
        message: `Successfully accessed bucket. Found ${files?.length || 0} folders/files.`,
      };
    }

    // Test 4: Try to upload a test file
    console.log('[Storage Test] Testing upload...');
    const testFileName = `test/storage-test-${Date.now()}.txt`;
    const testContent = `Storage test at ${new Date().toISOString()}`;
    const testBlob = new Blob([testContent], { type: 'text/plain' });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('brief-images')
      .upload(testFileName, testBlob, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      results.tests.upload = {
        status: 'error',
        error: uploadError.message,
        message: 'Cannot upload to bucket - check write permissions',
      };
    } else {
      results.tests.upload = {
        status: 'pass',
        uploadedFile: uploadData.path,
        message: 'Successfully uploaded test file',
      };

      // Test 5: Try to get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('brief-images')
        .getPublicUrl(uploadData.path);

      results.tests.publicUrl = {
        status: 'pass',
        url: publicUrl,
        message: 'Generated public URL',
      };

      // Test 6: Try to delete test file
      const { error: deleteError } = await supabase.storage
        .from('brief-images')
        .remove([testFileName]);

      if (deleteError) {
        results.tests.cleanup = {
          status: 'warning',
          error: deleteError.message,
          message: 'Could not delete test file (minor issue)',
        };
      } else {
        results.tests.cleanup = {
          status: 'pass',
          message: 'Successfully deleted test file',
        };
      }
    }

    // Summary
    const allPassed = Object.values(results.tests).every((test: any) =>
      test.status === 'pass' || test.status === 'warning'
    );

    results.summary = allPassed
      ? '✅ All tests passed! Storage is configured correctly.'
      : '❌ Some tests failed. Check the results above.';

    results.overallStatus = allPassed ? 'success' : 'failure';

    return NextResponse.json(results, { status: allPassed ? 200 : 500 });

  } catch (error) {
    console.error('[Storage Test] Unexpected error:', error);
    results.tests.unexpected = {
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    };
    results.summary = 'Unexpected error during testing';
    return NextResponse.json(results, { status: 500 });
  }
}
