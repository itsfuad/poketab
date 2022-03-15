[{
  id: '/#12poiajdspfoif',
  name: 'Uzair_Capazyte',
  key: 'The Office Fans'
}]

// addUser(id, name, key)
// removeUser(id)
// getUser(id)
// getUserList(key)

class Users {
  constructor () {
    this.users = [];
  }
  addUser (id, name, key, avatar) {
    var user = {id, name, key, avatar};
    this.users.push(user);
    return user;
  }
  removeUser (id) {
    var user = this.getUser(id);

    if (user) {
      this.users = this.users.filter((user) => user.id !== id);
    }

    return user;
  }
  getUser (id) {
    return this.users.filter((user) => user.id === id)[0]
  }
  getUserList (key) {
    var users = this.users.filter((user) => user.key === key);
    var namesArray = users.map((user) => user.name);
    return namesArray;
  }
  getAvatarList(key){
    var users = this.users.filter((user) => user.key === key);
    var avatarArray = users.map((user) => user.avatar);
    return avatarArray;
  }
  getUserId(key){
    var users = this.users.filter((user) => user.key === key);
    var idArray = users.map((user) => user.id);
    return idArray;
  }
}

module.exports = {Users};

 // class Person {
 //   constructor (name, age) {
 //     this.name = name;
 //     this.age = age;
 //   }
 //   getUserDescription () {
 //     return `${this.name} is ${this.age} year(s) old.`;
 //   }
 // }
 //
 // var me = new Person('Andrew', 25);
 // var description = me.getUserDescription();
 // console.log(description);
