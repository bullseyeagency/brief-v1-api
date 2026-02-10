interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  description,
  align = 'left',
  className = '',
}: SectionHeaderProps) {
  const alignClass = align === 'center' ? 'text-center' : 'text-left';

  return (
    <div className={`mb-12 ${alignClass} ${className}`}>
      <h2 className="text-4xl md:text-5xl font-bold text-black mb-2">
        {title}
      </h2>
      {subtitle && (
        <p className="text-xl text-gray-500 mb-4">
          {subtitle}
        </p>
      )}
      {description && (
        <p className="text-base text-gray-600 max-w-3xl leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
