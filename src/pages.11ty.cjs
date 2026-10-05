const site = require('./_includes/site.cjs');
module.exports = class {
  data() {
    return {
      entries: site.entries(),
      pagination: {data: 'entries', size: 1, alias: 'entry'},
      permalink: ({entry}) => entry.output,
      eleventyAllowMissingExtension: true,
      eleventyExcludeFromCollections: true
    };
  }
  render({entry}) { return site.render(entry); }
};
