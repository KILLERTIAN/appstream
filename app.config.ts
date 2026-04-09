export default ({ config }: { config: any }) => {
  const streamUrl = process.env.EXPO_PUBLIC_STREAM_URL;

  return {
    ...config,
    extra: {
      ...(config.extra ?? {}),
      EXPO_PUBLIC_STREAM_URL: streamUrl,
    },
  };
};

