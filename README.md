Just like vercel dev branches but self hosted and stanalne without extra baggage

# How it works

1. you need to setup a webhook in your project and point to wherever your server lives

2. write a config.ts file which decides whether or not to deploy a new dev branch using the current commit 


# Notes

Selecting the dockerfile 

by default we will recursively search all of your project for a dockerfile up to 3 levels and then cache it for future iterations (if the cache misses we perform it again) but you can also instead of returning an empty string in `config.ts` return a string which is a local path for the `Dockerfile` location