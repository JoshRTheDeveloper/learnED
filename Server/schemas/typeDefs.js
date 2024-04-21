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
    address: String 
    
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
  }
`;

module.exports = typeDefs;
