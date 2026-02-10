import { motion } from "framer-motion";
import { Quote } from "lucide-react";

interface Testimonial {
  id: number;
  quote: string;
  name: string;
  role: string;
  imageSrc: string;
}

interface TestimonialSectionProps {
  title: string;
  subtitle: string;
  testimonials: Testimonial[];
}

export const TestimonialCards = ({
  title,
  subtitle,
  testimonials,
}: TestimonialSectionProps) => {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className="w-full bg-background py-16 sm:py-24">
      <div className="container mx-auto max-w-6xl px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          {subtitle}
        </p>

        <motion.div
          className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.id}
              className="relative overflow-hidden rounded-lg bg-card shadow-sm"
              variants={itemVariants}
            >
              <div className="relative">
                <img
                  src={testimonial.imageSrc}
                  alt={testimonial.name}
                  className="h-80 w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 text-left text-white">
                <Quote className="mb-4 h-8 w-8 text-white/40" aria-hidden="true" />
                <blockquote className="text-base font-medium leading-relaxed">
                  {testimonial.quote}
                </blockquote>
                <figcaption className="mt-4">
                  <p className="font-semibold text-white">
                    — {testimonial.name},
                    <span className="ml-1 text-white/60">
                      {testimonial.role}
                    </span>
                  </p>
                </figcaption>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
