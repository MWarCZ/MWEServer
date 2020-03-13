
path=${path}/
mkdir ${path}

npx ts-node ./entity2json.ts default_user normal_user > ${path}user.json
npx ts-node ./entity2json.ts default_group normal_group > ${path}group.json
npx ts-node ./entity2json.ts default_member > ${path}member.json

