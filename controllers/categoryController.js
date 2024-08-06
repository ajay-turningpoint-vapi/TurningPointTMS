const Category = require("../models/Category");

exports.createCategory = async (req, res) => {
  const category = new Category({
    name: req.body.name,
  });
  try {
    const newCategory = await category.save();
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    // Uncomment the following line if you want to retrieve distinct categories
    const categories = await Category.distinct("name");

    // For now, return a simple JSON message
    res.json({ message: "Successfully fetched categories",categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.json({ message: "Internal server error", error: error.message });
  }
};
