#!/usr/bin/env sh

# abort on errors
set -e

# build
npm run build

# navigate into the build ouptut directory
cd dist

echo 'www.marktakatsuka.com' > CNAME

git init
git add -A
git commit -m 'deploy'
git push -f git@github.com:Takatsuka-Mark/Takatsuka-Mark.github.io.git master

cd -
