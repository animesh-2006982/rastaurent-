export const fallbackDishImages = {
  "chicken momo": "https://images.pexels.com/photos/36173262/pexels-photo-36173262.jpeg?auto=compress&cs=tinysrgb&w=900",
  "veg momo": "https://images.pexels.com/photos/28445589/pexels-photo-28445589.jpeg?auto=compress&cs=tinysrgb&w=900",
  "chicken pizza": "https://images.pexels.com/photos/5639548/pexels-photo-5639548.jpeg?auto=compress&cs=tinysrgb&w=900",
  "chicken biryani": "https://images.pexels.com/photos/4224314/pexels-photo-4224314.jpeg?auto=compress&cs=tinysrgb&w=900",
  "paneer butter masala": "https://images.pexels.com/photos/9609838/pexels-photo-9609838.jpeg?auto=compress&cs=tinysrgb&w=900",
  "french fries": "https://images.pexels.com/photos/8880729/pexels-photo-8880729.jpeg?auto=compress&cs=tinysrgb&w=900",
  "cold drink": "https://images.pexels.com/photos/20045266/pexels-photo-20045266.jpeg?auto=compress&cs=tinysrgb&w=900",
  "gulab jamun": "https://images.pexels.com/photos/9198596/pexels-photo-9198596.jpeg?auto=compress&cs=tinysrgb&w=900",
  "chilli chicken": "https://images.pexels.com/photos/28674534/pexels-photo-28674534.jpeg?auto=compress&cs=tinysrgb&w=900",
  "chicken fry": "https://images.pexels.com/photos/35267270/pexels-photo-35267270.jpeg?auto=compress&cs=tinysrgb&w=900",
  "chiken fry": "https://images.pexels.com/photos/35267270/pexels-photo-35267270.jpeg?auto=compress&cs=tinysrgb&w=900",
};

export const getDishImage = (product = {}) => {
  const remote = String(product.img || "").trim();
  if (remote) return remote;

  const key = String(product.name || "").trim().toLowerCase();
  return fallbackDishImages[key] || "";
};
