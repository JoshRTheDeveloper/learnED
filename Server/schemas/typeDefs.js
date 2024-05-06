const typeDefs = `


  type Auth {
    token: ID! # JWT 
    user: User! # Authenticated 
  }

  type User {
    _id: ID
    firstName: String!
    lastName: String!
    email: String!
    profilePicture: String 
    streetAddress: String
    city: String
    state: String
    zip: String 
    
  }

  
  type Query {
    getUsers: [User]
    getUser(_id: ID): User
  }

  type Mutation {
    loginUser (email: String!, password: String!): Auth! # Login mutation
    
    logout: String! # Logout mutation
  
    createUser(
      firstName: String!, 
      lastName: String!, 
      email: String!, 
      password: String!): Auth

      changeProfilePicture(_id: ID!, profilePicture: String!): User!
      changeStreetAddress(_id: ID!, streetAddress: String!): User!
      changeCity(_id: ID!, city: String!): User!
      changeState(_id: ID!, state: String!): User!
      changeZip(_id: ID!, zip: String!): User!
      changeEmail(_id: ID!, email: String!): User!
  }
`;

module.exports = typeDefs;
