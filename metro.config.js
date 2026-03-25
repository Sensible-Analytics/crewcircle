const { getDefaultConfig } = require('metro-config');
const path = require('path');

module.exports = (async () => {
  const {
    resolver: { sourceExts, assetExts },
  } = await getDefaultConfig();

  return {
    resolver: {
      assetExts: assetExts.filter(ext => ext !== 'svg'),
      sourceExts: [...sourceExts, 'mjs', 'cjs', 'js', 'json', 'ts', 'tsx', 'svg'],
      watchFolders: [
        // Watch the root of the monorepo (where packages and apps are)
        path.resolve(__dirname),
        // Also watch the packages directory explicitly (though root covers it)
        path.resolve(__dirname, 'packages'),
        path.resolve(__dirname, 'apps'),
      ],
      // If you are using pnpm, you might need to add the virtual store to nodeModulesPaths
      // But note: the pnpm store is in node_modules/.pnpm, and the symlinks are in the root node_modules.
      // We are already watching the root, which includes the symlinks in node_modules.
      // However, Metro might not follow symlinks by default, so we also try to add the packages and apps as additional directories.
      // Alternatively, we can try to set nodeModulesPaths to include the root node_modules and the pnpm packages.
      // Let's try without nodeModulesPaths first and see if it works.
      // If we encounter issues, we can add:
      // nodeModulesPaths: [
      //   path.resolve(__dirname, 'node_modules'),
      //   path.resolve(__dirname, '../../node_modules/.pnpm'), // Adjust if needed
      // ],
    },
  };
})();
