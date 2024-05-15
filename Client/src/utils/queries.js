import { gql } from '@apollo/client';

export const GET_USER = gql`
  query GetUser($userId: ID!) {
    getUser(_id: $userId) {
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
      invoices {
        _id
        invoiceNumber
        invoiceAmount
        paidStatus
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
        invoice_details
      }
    }
  }
`;

export const GET_USERS = gql`
  query GetUser($userId: ID!) {
    getUser(_id: $userId) {
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
      invoices {
        _id
        invoiceNumber
        invoiceAmount
        paidStatus
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
        invoice_details
      }
    }
  }
`;

export const GET_INVOICES = gql`
  query getInvoices {
    getInvoices {
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

export const GET_INVOICE = gql`
  query getInvoice($id: ID!) {
    getInvoice(_id: $id) {
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

export const GET_USER_INVOICES = gql`
  query getUserInvoices($userId: ID!) {
    getUserInvoices(userId: $userId) {
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

export const GET_INVOICES_BY_NUMBER = gql`
  query getInvoicesByNumber($userId: ID!, $invoiceNumber: String!) {
    getInvoicesByNumber(userId: $userId, invoiceNumber: $invoiceNumber) {
      _id
      invoiceNumber
    }
  }
`;