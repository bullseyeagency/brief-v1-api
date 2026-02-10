"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FeatureItem {
  id: number;
  title: string;
  image?: string;
  description: string;
}

interface AccordionFeatureProps {
  features: FeatureItem[];
}

export default function AccordionFeature({ features }: AccordionFeatureProps) {
  const [activeTabId, setActiveTabId] = useState<number | null>(features[0]?.id || 1);
  const [activeImage, setActiveImage] = useState(features[0]?.image);

  return (
    <section className="py-32">
      <div className="container mx-auto">
        <div className="mb-12 flex w-full items-start justify-between gap-12">
          <div className="w-full md:w-1/2">
            <Accordion type="single" className="w-full" defaultValue={`item-${features[0]?.id}`}>
              {features.map((tab) => (
                <AccordionItem key={tab.id} value={`item-${tab.id}`}>
                  <AccordionTrigger
                    onClick={() => {
                      setActiveImage(tab.image);
                      setActiveTabId(tab.id);
                    }}
                    className="cursor-pointer py-5 !no-underline transition"
                  >
                    <h6
                      className={`text-xl font-semibold ${
                        tab.id === activeTabId
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {tab.title}
                    </h6>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="mt-3 text-muted-foreground">
                      {tab.description}
                    </p>
                    {tab.image && (
                      <div className="mt-4 md:hidden">
                        <img
                          src={tab.image}
                          alt={tab.title}
                          className="h-full max-h-80 w-full rounded-md object-cover"
                        />
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          {activeImage && (
            <div className="relative m-auto hidden w-1/2 overflow-hidden rounded-xl bg-muted md:block">
              <img
                src={activeImage}
                alt="Feature preview"
                className="aspect-[4/3] rounded-md object-cover pl-4"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
