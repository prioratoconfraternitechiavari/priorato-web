module.exports = function (eleventyConfig) {
  for (const directory of ['assets', 'images']) {
    eleventyConfig.addPassthroughCopy({[`src/${directory}`]: directory});
  }
  eleventyConfig.addPassthroughCopy({'src/favicon.ico': 'favicon.ico'});
  eleventyConfig.addWatchTarget('./content/');
  eleventyConfig.addWatchTarget('./src/_includes/');
  return {dir: {input: 'src', includes: '_includes', output: '_site'}, templateFormats: ['11ty.js']};
};
