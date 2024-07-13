const typeDefs = `


type Auth {
  token: ID!
  user: User!
}

type User {
  _id: ID
  company: String
  firstName: String!
  lastName: String!
  email: String!
  profilePicture: String
  streetAddress: String
  city: String
  state: String
  zip: String
  invoices: [Invoice]
}

type Invoice {
  _id: ID
  invoiceAmount: Float!
  paidStatus: Boolean!
  invoiceNumber: String!
  companyName: String!
  companyStreetAddress: String
  companyCityAddress: String
  companyEmail: String!
  clientName: String!
  clientStreetAddress: String
  clientCityAddress: String
  clientEmail: String!
  dateCreated: String!
  dueDate: String!
  user: User!
  invoice_details: String!
}

type DeleteInvoicePayload {
  success: Boolean!
  message: String!
}

type Query {
  getUsers: [User]
  getUser(_id: ID): User
  getInvoices: [Invoice]
  getInvoice(_id: ID): Invoice
  getUserInvoices(userId: ID!): [Invoice]
  getInvoicesByNumber(userId: ID!, invoiceNumber: String): [Invoice]
}

type Mutation {
  loginUser(email: String!, password: String!): Auth!
  logout: String!
  createUser(
    company: String
    firstName: String!
    lastName: String!
    email: String!
    password: String!
  ): Auth
  changeProfilePicture(_id: ID!, profilePicture: String!): User!
  changeCompany(_id: ID!, company: String!): User!
  changeStreetAddress(_id: ID!, streetAddress: String!): User!
  changeCity(_id: ID!, city: String!): User!
  changeState(_id: ID!, state: String!): User!
  changeZip(_id: ID!, zip: String!): User!
  changeEmail(_id: ID!, email: String!): User!
  createInvoice(
    invoiceAmount: Float!
    paidStatus: Boolean!
    invoiceNumber: String!
    companyName: String!
    companyStreetAddress: String
    companyCityAddress: String
    companyEmail: String!
    clientName: String!
    clientStreetAddress: String
    clientCityAddress: String
    clientEmail: String!
    dueDate: String!
    userID: ID!
    invoice_details: String!
  ): Invoice!
  updateInvoice(invoiceNumber: String!, paidStatus: Boolean!): Invoice!
  deleteInvoice(invoiceNumber: String!): DeleteInvoicePayload!
}

`;

module.exports = typeDefs;
