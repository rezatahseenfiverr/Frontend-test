import React from 'react';

const StatsSection = () => {
  const stats = [
    {
      number: "10K+",
      label: "Happy Customers",
      icon: "😊",
      color: "from-green-500 to-green-600"
    },
    {
      number: "50K+",
      label: "Products Sold",
      icon: "📦",
      color: "from-blue-500 to-blue-600"
    },
    {
      number: "99%",
      label: "Satisfaction Rate",
      icon: "⭐",
      color: "from-yellow-500 to-yellow-600"
    },
    {
      number: "24/7",
      label: "Customer Support",
      icon: "🛡️",
      color: "from-purple-500 to-purple-600"
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-r from-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Trusted by Thousands
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join our growing community of satisfied customers
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center group hover-lift"
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${stat.color} text-white text-2xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                {stat.icon}
              </div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {stat.number}
              </div>
              <div className="text-gray-600 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
