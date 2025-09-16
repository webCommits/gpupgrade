module.exports = function(eleventyConfig) {

  // Passthroughs
  eleventyConfig.addPassthroughCopy("src/static/style.css");
  eleventyConfig.addPassthroughCopy("src/static/script.js");
  eleventyConfig.addPassthroughCopy("src/static/images");
  eleventyConfig.addPassthroughCopy("src/static/svg");

  // Global Data
  eleventyConfig.addGlobalData("global", () => {
    if (process.env.ELEVENTY_ENV === "prod") {
      return { url: "https://webcommits.github.io/gpupgrade" };
    } else {
      return { url: "" };
    }
  });

  // Input/Output
  return {
    dir: {
      input: "src",
      output: "docs",
      includes: "_includes"
    }
  };
};
