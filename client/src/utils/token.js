const TOKENKEY = "token_key";
function setLocalToken(token) {
  localStorage.setItem(TOKENKEY, token);
}

function getLocalToken() {
  return localStorage.getItem(TOKENKEY);
}

function removeLocalToken() {
  localStorage.removeItem(TOKENKEY);
}

export { setLocalToken, getLocalToken, removeLocalToken };
