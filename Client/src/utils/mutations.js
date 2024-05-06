import { gql } from '@apollo/client';

export const CREATE_USER = gql`
  mutation createUser(
    $firstName: String!
    $lastName: String!
    $email: String!
    $password: String!
  ) {
    createUser(
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

export const CREATE_BOOKING = gql`
  mutation 
  createBooking(
    $userId: ID!, 
    $serviceId: ID!, 
    $staffId: ID!, 
    $addOnId: ID,
    $phoneNumber: String
    $date: String!, 
    $time: String!
    ) {
    createBooking
    (userId: $userId, 
      serviceId: $serviceId, 
      addOnId: $addOnId,
      phoneNumber: $phoneNumber
      staffId: $staffId, 
      date: $date, 
      time: $time) {
      _id
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

