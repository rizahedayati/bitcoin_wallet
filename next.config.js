module.exports = {
  reactStrictMode: true,
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };
    
    return config;
  },
  
}
