module.exports = function(eleventyConfig){

    eleventyConfig.addPassthroughCopy("src/static/style.css")
    eleventyConfig.addPassthroughCopy("src/static/script.js")
    eleventyConfig.addPassthroughCopy("src/static/images")
    eleventyConfig.addPassthroughCopy("src/static/svg")
    return {
        dir: {
          input: "src",
          output: "docs"
        }
      };
}