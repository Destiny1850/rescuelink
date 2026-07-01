interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'gold' | 'forest';
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const styles = {
    default: 'bg-mist/10 text-mist border-mist/20',
    gold: 'bg-gold/10 text-gold border-gold/30',
    forest: 'bg-forest/10 text-forest border-forest/20',
  }[variant];

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles}`}>
      {children}
    </span>
  );
}
