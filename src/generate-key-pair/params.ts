export const DEFAULT_RSA_KEY_CONFIG = {
  name: "RSA-OAEP",
  modulusLength: 4096,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: { name: "SHA-256" },
};
