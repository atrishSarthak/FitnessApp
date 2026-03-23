import { createClient } from '@sanity/client';
import imageUrlBuilder from "@sanity/image-url";

export const client = createClient({
  projectId: "erf0p9zk",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
});

//Admin level client, used for backend 
//admin client for mutations

export const adminClient = createClient({
  projectId: "erf0p9zk",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});


//Image URL builder 
const builder = imageUrlBuilder(client);
export const urlFor = (source: string) => builder.image(source);