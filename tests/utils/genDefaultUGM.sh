
folder=default
mkdir ${folder}
npx ts-node ./entity2json.ts default_user > ${folder}/user.json
npx ts-node ./entity2json.ts default_group > ${folder}/group.json
npx ts-node ./entity2json.ts default_member > ${folder}/member.json


