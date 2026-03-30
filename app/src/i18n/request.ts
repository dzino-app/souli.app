import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  return {
    locale: "sk",
    messages: (await import("@/messages/sk.json")).default,
  };
});
