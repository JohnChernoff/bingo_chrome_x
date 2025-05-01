'use strict';

let twitchToken;

const clientId = "qvrllaetqfb5iqkty4wlwdq4ml38z7";
const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/`;
const scopes = "user:read:chat user:write:chat";
const authUrl = `https://id.twitch.tv/oauth2/authorize?force_verify=true&client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${encodeURIComponent(scopes)}`;

function setToken(token) {
  twitchToken = token;
  getTwitchUserId(twitchToken,clientId).then(id => {
    let validToken = id && id.name;
    document.getElementById("txt_twitch_id").innerText = validToken ? id.name : "(not logged in)";
    document.getElementById("butt_twitch").style.backgroundColor = validToken ? "red" : "blue";
    document.getElementById("butt_twitch").innerText = validToken ? "Switch Twitch Login" : "Login to Twitch";
  });
}

class OptionsCtrl {

  constructor() {
    this.elements = {
      enabled: document.getElementById('enabled'),
      ante: document.getElementById('input_ante'),
      instabet: document.getElementById('input_instabet'),
      card_type: document.getElementById('select_card_type'),
      status: document.getElementById('status'),
      bingo_bot_url: document.getElementById('input_srv'),
      defaultButton: document.getElementById('default')
    };

    document.getElementById("butt_twitch").addEventListener("click", async () => {
      let newToken = !twitchToken || twitchToken === "" || confirm("Change Twitch Login?");
      if (newToken) {
        chrome.identity.launchWebAuthFlow(
          { url: authUrl, interactive: true },
          (redirectUrl) => {
            if (chrome.runtime.lastError) { console.error(chrome.runtime.lastError); return; }
            const urlParams = new URLSearchParams(new URL(redirectUrl).hash.substring(1));
            setToken(urlParams.get("access_token"));
            this.save(true);
          });
      }
    });
    document.getElementById("input_srv").addEventListener("change", async () => {
      console.log("Server changed: ",document.getElementById("input_srv").value);
      this.save(true);
    });

  }

  save = (showStatus = true) => {
    const doSaved = () => {
      if (showStatus) {
        // Update status to let user know options were saved.
        const status = this.elements.status;
        status.textContent = '\u2714 Your preferences have been saved.';
        status.classList.remove('faded');
        setTimeout(() => status.classList.add('faded'), 5000);
      }
    };

    UserPrefs.saveOptions({
      enabled: this.elements.enabled.checked,
      ante: this.elements.ante.value,
      instabet: this.elements.instabet.value,
      card_type: this.elements.card_type.value,
      bingo_bot_url: this.elements.bingo_bot_url.value,
      twitch_token: twitchToken,
    }).then(doSaved);
  };

  reset = () => {
    setToken(UserPrefs.defaults.twitch_token);
    this.elements.enabled.checked = UserPrefs.defaults.enabled;
    this.elements.ante.value = UserPrefs.defaults.ante;
    this.elements.instabet.value = UserPrefs.defaults.instabet;
    this.elements.card_type.value = UserPrefs.defaults.card_type;
    this.elements.bingo_bot_url.value = UserPrefs.defaults.bingo_bot_url;
    this.save(); //don't reset token
  };

  // Restores select box and checkbox state using the preferences storage.
  restore = (options) => { //console.log("Restoring options",JSON.stringify(options));
    this.elements.enabled.checked = options.enabled;
    this.elements.ante.value = options.ante;
    this.elements.instabet.value = options.instabet;
    this.elements.card_type.value = options.card_type;
    this.elements.bingo_bot_url.value = options.bingo_bot_url;
    setToken(options.twitch_token);
  };

  init = () => {
    document.addEventListener('DOMContentLoaded', async () => {
      try {
        const items = await UserPrefs.getOptions();
        this.restore(items);
        this.elements.defaultButton.addEventListener('click', () => this.reset());
        this.elements.enabled.addEventListener('change', () => this.save(false));
        document.querySelectorAll('[data-saveOn]').forEach(el => {
          el.addEventListener(el.getAttribute('data-saveOn'), () => { this.save(); });
        });

        document.querySelectorAll('.links').forEach(el => {
          el.addEventListener('click', event => {
            event.preventDefault();
            if (event.target.href === undefined) { return; }
            chrome.tabs.create({ url: event.target.href });
          });
        });
      } catch (error) {
        console.error('Error initializing options:', error);
      }
    });
  };

}

console.log("Whee");
window.optionsCtrl = new OptionsCtrl();
window.optionsCtrl.init();

async function getTwitchUserId(oauthToken, clientId) {
  if (oauthToken && oauthToken !== "") try {
    const response = await fetch("https://api.twitch.tv/helix/users", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${oauthToken}`,
        "Client-Id": clientId
      }
    });
    if (!response.ok) {
      console.error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json(); //console.log(JSON.stringify(data));
    if (data.data && data.data.length > 0) {
      return {id: data.data[0].id, name: data.data[0].display_name };
    } else {
      console.error("No user data found.");
    }
  } catch (error) {
    console.error("Error fetching Twitch user ID:", error);
  }
  return null;
}
