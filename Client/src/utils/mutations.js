import { gql } from '@apollo/client';

export const CREATE_USER = gql`
  mutation createUser(
    $company: String
    $firstName: String!
    $lastName: String!
    $email: String!
    $password: String!
  ) {
    createUser(
      company: $company
      firstName: $firstName
      lastName: $lastName
      email: $email
      password: $password
    ) {
      token
      user {
        _id
      }
    }
  }
`;





export const LOGIN_USER = gql`
mutation loginUser($email: String!, $password: String!) {
  loginUser(email: $email, password: $password) {
    token
    user {
      _id
      firstName
      lastName
    }
  }
}
`;

export const CHANGE_STREET_ADDRESS = gql`
  mutation ChangeStreetAddress($userId: ID!, $streetAddress: String!) {
    changeStreetAddress(_id: $userId, streetAddress: $streetAddress) {
      _id
      firstName
      lastName
      email
      profilePicture
      streetAddress
      city
      state
      zip
    }
  }
`;



export const CHANGE_EMAIL = gql`
  mutation ChangeEmail($userId: ID!, $email: String!) {
    changeEmail(_id: $userId, email: $email){
      _id
      firstName
      lastName
      email
      profilePicture
      streetAddress
      city
      state
      zip
    }
  }
`;

export const CHANGE_CITY = gql`
  mutation ChangeCity($userId: ID!, $city: String!) {
    changeCity(_id: $userId, city: $city) {
      _id
      firstName
      lastName
      email
      profilePicture
      streetAddress
      city
      state
      zip
    }
  }
`;

export const CHANGE_STATE = gql`
  mutation ChangeState($userId: ID!, $state: String!) {
    changeState(_id: $userId, state: $state) {
      _id
      firstName
      lastName
      email
      profilePicture
      streetAddress
      city
      state
      zip
    }
  }
`;

export const CHANGE_ZIP = gql`
  mutation ChangeZip($userId: ID!, $zip: String!) {
    changeZip(_id: $userId, zip: $zip) {
      _id
      firstName
      lastName
      email
      profilePicture
      streetAddress
      city
      state
      zip
    }
  }
`;


export const CHANGE_PROFILE_PICTURE = gql`
  mutation ChangeProfilePicture($userId: ID!, $profilePicture: String!) {
    changeProfilePicture(_id: $userId, profilePicture: $profilePicture){
      _id
      firstName
      lastName
      email
      profilePicture
      streetAddress
      city
      state
      zip
    }
  }
`;

export const CHANGE_COMPANY= gql`
  mutation ChangeCompany($userId: ID!, $company: String!) {
    changeCompany(_id: $userId, company: $company){
      _id
      company
      firstName
      lastName
      email
      profilePicture
      streetAddress
      city
      state
      zip
    }
  }
`;

export const CREATE_INVOICE = gql`
  mutation createInvoice(
    $invoiceAmount: Float!, 
    $paidStatus: Boolean!, 
    $invoiceNumber: String!, 
    $companyName: String!, 
    $companyStreetAddress: String, 
    $companyCityAddress: String, 
    $companyEmail: String!, 
    $clientName: String!, 
    $clientStreetAddress: String, 
    $clientCityAddress: String, 
    $clientEmail: String!, 
    $dueDate: String!, 
    $userID: ID!, 
    $invoice_details: String!
  ) {
    createInvoice(
      invoiceAmount: $invoiceAmount, 
      paidStatus: $paidStatus, 
      invoiceNumber: $invoiceNumber, 
      companyName: $companyName, 
      companyStreetAddress: $companyStreetAddress, 
      companyCityAddress: $companyCityAddress, 
      companyEmail: $companyEmail, 
      clientName: $clientName, 
      clientStreetAddress: $clientStreetAddress, 
      clientCityAddress: $clientCityAddress, 
      clientEmail: $clientEmail, 
      dueDate: $dueDate, 
      userID: $userID, 
      invoice_details: $invoice_details
    ) {
      _id
      invoiceAmount
      paidStatus
      invoiceNumber
      companyName
      companyStreetAddress
      companyCityAddress
      companyEmail
      clientName
      clientStreetAddress
      clientCityAddress
      clientEmail
      dateCreated
      dueDate
      user {
        _id
      }
      invoice_details
    }
  }
`;


export const UPDATE_INVOICE = gql`
  mutation updateInvoice($id: ID!, $invoiceAmount: Decimal, $paidStatus: Boolean, $invoiceNumber: String, $companyName: String, $companyStreetAddress: String, $companyCityAddress: String, $companyEmail: String, $clientName: String, $clientStreetAddress: String, $clientCityAddress: String, $clientEmail: String, $dueDate: Date, $invoice_details: String) {
    updateInvoice(_id: $id, invoiceAmount: $invoiceAmount, paidStatus: $paidStatus, invoiceNumber: $invoiceNumber, companyName: $companyName, companyStreetAddress: $companyStreetAddress, companyCityAddress: $companyCityAddress, companyEmail: $companyEmail, clientName: $clientName, clientStreetAddress: $clientStreetAddress, clientCityAddress: $clientCityAddress, clientEmail: $clientEmail, dueDate: $dueDate, invoice_details: $invoice_details) {
      _id
      invoiceAmount
      paidStatus
      invoiceNumber
      companyName
      companyStreetAddress
      companyCityAddress
      companyEmail
      clientName
      clientStreetAddress
      clientCityAddress
      clientEmail
      dateCreated
      dueDate
      user {
        _id
        firstName
        lastName
      }
      invoice_details
    }
  }
`;

export const DELETE_INVOICE = gql`
  mutation deleteInvoice($id: ID!) {
    deleteInvoice(_id: $id) {
      _id
      invoiceAmount
      paidStatus
      invoiceNumber
      companyName
      companyStreetAddress
      companyCityAddress
      companyEmail
      clientName
      clientStreetAddress
      clientCityAddress
      clientEmail
      dateCreated
      dueDate
      user {
        _id
        firstName
        lastName
      }
      invoice_details
    }
  }
`;