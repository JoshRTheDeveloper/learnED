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

export const CHANGE_ADDRESS = gql`
mutation ChangeAddress($userId: ID!, $address: String!) {
  changeAddress(_id: $userId, address: $address) {
    _id
    firstName
    lastName
    email
    profilePicture
    address
  }
}

`;

// Mutation to change email
export const CHANGE_EMAIL = gql`
  mutation ChangeEmail($userId: ID!, $email: String!) {
    changeEmail(_id: $userId, email: $email) {
      _id
      firstName
      lastName
      email
      profilePicture
      address
    }
  }
`;

export const CHANGE_PROFILE_PICTURE = gql`
mutation ChangeProfilePicture($userId: ID!, $profilePicture: Upload!) {
  changeProfilePicture(_id: $userId, profilePicture: $profilePicture) {
    _id
    firstName
    lastName
    email
    profilePicture
    address
  }
}
`;

