export function PhilosophySection() {
  const pillars = [
    {
      title: "Focus on Making",
      description: "We handle the rest of the business.",
    },
    {
      title: "One Workspace",
      description:
        "Manage orders, inventory, and customers in one place.",
    },
    {
      title: "Smarter Operations",
      description:
        "Let AI handle repetitive tasks automatically.",
    },
  ];

  return (
    <section
      className="border-t border-warm-gold/20 bg-ivory/50 py-16 px-4"
      aria-label="Our philosophy"
    >
      <div className="mx-auto max-w-4xl">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map(({ title, description }) => (
            <div
              key={title}
              className="space-y-2 text-center sm:text-left"
            >
              <h3 className="font-serif text-lg font-semibold text-forest-green">
                {title}
              </h3>
              <p className="font-sans text-sm text-charcoal/80 leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
