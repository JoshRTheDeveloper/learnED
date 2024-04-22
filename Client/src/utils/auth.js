import decode from 'jwt-decode';

class Auth {
  getProfile() {
    return decode(this.getToken());
  }

  loggedIn() {

    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  isTokenExpired(token) {
    try {
      const decoded = decode(token);
      if (decoded.exp < Date.now() / 1000) {
        return true;
      } else return false;
    } catch (err) {
      return false;
    }
  }

  getToken() {
   
    return localStorage.getItem('authToken');
  }

  setToken(token) {
   
    localStorage.setItem('authToken', token);
  }

  clearToken() {
    
    localStorage.removeItem('authToken');
  }

  login(token) {
   
    localStorage.setItem('authToken', token);
   // window.location.assign('/login'); 
   // redirect use if neeeded
  }

  logout() {

    this.clearToken();

   
    // window.location.assign('/login'); 
    // redirect use if needed
  }
}

const auth = new Auth();

export default auth;
