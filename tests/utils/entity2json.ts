import { ProtectedGroups, ProtectedMembers, ProtectedUsers } from '../../src/api/helpers'
import { Group, Member, User } from '../../src/entity'

function entity2json(entity: any, space?: string|number) {
  return JSON.stringify(entity, null, space)
}
function entities2json(entities: any[], space?: string | number) {
  return JSON.stringify(entities, null, space)
}

function getDefaultUsers(options: { fromId: number }) {
  const { fromId } = options
  // Uzivatele
  let users: User[] = Object.values(ProtectedUsers).map((name, id) => new User({
    id: id + fromId, login: `${name}`.toLocaleLowerCase(), password: `${name}`, protected: true,
  }))
  users.find(user => {
    if (user.login === ProtectedUsers.System.toLowerCase()) { user.locked = true }
    return user.locked
  })
  return Promise.all(users.map(async user => {
    await user.hashPassword()
    return user
  }))
}
function getDefaultGroups(options: { fromId: number }) {
  const { fromId } = options
  // Skupiny
  let groups: Group[] = Object.values(ProtectedGroups).map((name, id) => new Group({
    id: id + fromId, name, protected: true,
  }))
  return groups
}
function getDefaultMembers(options: { users: User[], groups: Group[] }) {
  const { users, groups } = options
  // clenstvi
  let members: Member[] = []
  for (let groupName in ProtectedMembers) {
    let user = users.find(u => u.login === (ProtectedMembers as any)[groupName].toLowerCase())
    let group = groups.find(u => u.name === groupName)
    if (user && group) {
      let member = new Member()
      member.userId = user.id
      member.groupId = group.id
      member.protected = true
      member.showMembers = true
      members.push(member)
    }
  }
  return members
}

function getNormalUsers(options:{ count: number, fromId: number}) {
  let {count = 1, fromId = 1} = options
  let users: User[] = []
  for (let i = 0; i < count; i++) {
    let newId = fromId + i
    users.push(new User({
      id: newId,
      login: `user${newId}`,
      password: `user${newId}`,
      firstName: `User-${newId}`,
      lastName: `Resu-${newId}`,
      email: `user${newId}@user.xxx`,
    }))
  }
  return Promise.all(users.map(async user => {
    await user.hashPassword()
    return user
  }))
}
function getNormalGroups(options: { count: number, fromId: number }) {
  let { count = 1, fromId = 1 } = options
  let groups: Group[] = []
  for (let i = 0; i < count; i++) {
    let newId = fromId + i
    groups.push(new Group({
      id: newId,
      name: `Group${newId}`,
    }))
  }
  return groups
}

async function xbin() {
  console.error('Start ...')
  console.error(process.argv)
  let arrayObj: any[] = []
  const keys = {
    user: 1,
    group: 1,
  }
  for (let argv of process.argv) {
    let tmp: any[]
    switch (argv) {
      case 'default_user':
        tmp = await getDefaultUsers({ fromId: keys.user })
        keys.user += tmp.length
        arrayObj.push(...tmp)
        break
      case 'default_group':
        tmp = getDefaultGroups({ fromId: keys.group })
        keys.group += tmp.length
        arrayObj.push(...tmp)
        break
      case 'default_member':
        tmp = getDefaultMembers({
          users: await getDefaultUsers({ fromId: keys.user }),
          groups: getDefaultGroups({ fromId: keys.group }),
        })
        arrayObj.push(...tmp)
        break
      case 'normal_user':
        tmp = (await getNormalUsers({
          count: 10, fromId: keys.user,
        })).map(user => {
          if ([keys.user + 4, keys.user + 5].includes(user.id as number)) user.locked = true // 2xZamlky
          if (user.id as number >= keys.user + 5) user.removed = true // 5xSmazany
          return user
        })
        keys.user += tmp.length
        arrayObj.push(...tmp)
        break
      case 'normal_group':
        tmp = getNormalGroups({
          count: 6, fromId: keys.group++,
        }).map(group => {
          if ([keys.group + 1, keys.group + 2].includes(group.id as number)) group.removed = true // 2xSmazany
          return group
        })
        keys.group += tmp.length
        arrayObj.push(...tmp)
        break
      default:
    }
  }

  console.log(entities2json(arrayObj, 2))

  console.error('End.')
}

xbin()
