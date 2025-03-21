'use strict';

const defaults = {
  ante: 50,
  instabet: 50,
  card_type: 'free_edge',
  enabled: false,
  bingo_bot_url: 'https://chess.bingo:6667/', //http://localhost/twitchsrv
  twitch_token: ''
};

class UserPrefs {
  static async getOptions(keys = defaults) {
    try { //console.log(browser.storage)
      const storage = browser.storage.sync ?? browser.storage.local;
      return await storage.get(keys);
    } catch (error) {
      console.error('Error retrieving options:', error);
      throw error;
    }
  }

  static async saveOptions(items) {
    console.log('Creating new options:', JSON.stringify(items));
    try {
      const storage = browser.storage.sync ?? browser.storage.local;
      await storage.set(items);
    } catch (error) {
      console.error('Error saving options:', error);
      throw error;
    }
  }
}

UserPrefs.defaults = defaults;
