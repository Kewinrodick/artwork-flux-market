import { motion } from "framer-motion";
import { Palette, DollarSign, Shield, Zap } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Palette,
      title: "For Designers",
      description: "Upload your artwork, set your price, and earn on every sale. Full creative control.",
    },
    {
      icon: DollarSign,
      title: "Fair Pricing",
      description: "Transparent commission structure. You keep what you earn with instant payouts.",
    },
    {
      icon: Shield,
      title: "Secure Licensing",
      description: "Protect your work with built-in licensing agreements and copyright protection.",
    },
    {
      icon: Zap,
      title: "Instant Downloads",
      description: "Buyers get high-res files immediately. Fast, simple, and secure transactions.",
    },
  ];

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

      <div className="container mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Why Choose <span className="text-primary text-glow">T Design</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Built for the modern creator economy
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="text-center group"
            >
              <div className="mb-6 inline-flex items-center justify-center w-20 h-20 bg-card border border-border group-hover:border-primary rounded-lg transition-all duration-300 group-hover:shadow-glow">
                <feature.icon className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
