const axios = require("axios");

class Wit {
  /**
   * Authentication wit app
   * @param {string} AUTH_TOKEN
   * https://api.wit.ai/samples?v=201703077
   */
  constructor() {
    this.api = 'https://api.wit.ai/';
    this.version = 201703077;
    this.params = {};
    this.intent = "intent";

    console.log("Create WitClient >>>");
    axios.defaults.headers.common["Authorization"] = "Bearer " + 'AAWV75Z63KG4YVO42262OB4D6QGZTDOK';
    axios.defaults.headers.post["Content-Type"] = "application/json";
  }

  // Execute api
  async run(setURL = "") {
    if (this.method && this.action) {
      const url = (setURL ? setURL : (this.api + this.action)) + "?v=" + this.version;
      let params = this.params;

      switch (this.method) {
        case "get": {
          const result = await axios
            .get(url, { params: params })
            .then(result => result.data)
            .catch(err => {
              console.log(err.response.data);
              return {
                error: true,
                message: err.response.data.error
              };
            });
          return result;
        }
        case "post": {
          const result = await axios
            .post(url, params)
            .then(result => result.data)
            .catch(err => {
              console.log(err.response.data);
              return {
                error: true,
                message: err.response.data.error
              };
            });
          return result;
        }
        case "delete": {
          const result = await axios
            .delete(url, { data: params })
            .then(result => result.data)
            .catch(err => {
              console.log(err.response.data);
              return {
                error: true,
                message: err.response.data.error
              };
            });
          return result;
        }
        case "put": {
          const result = await axios
            .put(url, params)
            .then(result => result.data)
            .catch(err => {
              console.log(err.response.data);
              return {
                error: true,
                message: err.response.data.error
              };
            });
          return result;
        }
        default:
          return false;
      }
    }

    return false;
  }

  /**
   * Execute detect question
   * @param {string} question
   * https://wit.ai/docs/http/20170307#get__samples_link
   */
  async questions() {
    this.params = { limit: 10000 };
    this.method = "get";
    this.action = "samples";
    return await this.run();
  }

  /**
   * Execute detect question
   * @param {string} question
   * https://wit.ai/docs/http/20170307#get__message_link
   */
  async detectQuestion(question) {
    question = question.trim();
    this.params = { q: question };
    this.method = "get";
    this.action = "message";
    return await this.run();
  }

  /**
   * Execute training question
   * @param {string} text
   * @param {Array[Object]} entities
   * https://wit.ai/docs/http/20170307#post__samples_link
   */
  async trainingQuestion(text, entities) {
    text = text.trim();
    this.params = [
      {
        text,
        entities
      }
    ];
    this.method = "post";
    this.action = "samples";
    return await this.run();
  }

  /**
   * Execute Delete question
   * @param {Array[Object]} params
   * https://wit.ai/docs/http/20170307#delete__samples_link
   */
  async deleteQuestion(params) {
    this.params = params;
    this.method = "delete";
    this.action = "samples";
    return await this.run();
  }

  /**
   * Execute list all entities / intents
   * https://wit.ai/docs/http/20170307#get__entities_link
   */
  async entities() {
    this.method = "get";
    this.action = "entities";
    return await this.run();
  }

  /**
   * Execute get info a entity
   * @param {string} id 
   * https://wit.ai/docs/http/20170307#get__entities__entity_id_link
   */
  async infoEntity(id) {
    id = id.trim();
    const url = this.api + "entities/" + id;
    this.method = "get";
    this.action = "entities";
    return await this.run(url);
  }

  /**
   * Execute Creates a new entity
   * @param {string} id 
   * @param {Object} values 
   * https://wit.ai/docs/http/20170307#post__entities_link
   * https://wit.ai/docs/http/20170307#put__entities__entity_id_link
   */
  async createEntity(id, values, lookups = ["free-text"]) {
    id = id.trim();
    this.params = {
      id,
      doc: id
    };
    this.method = "post";
    this.action = "entities";
    const result = await this.run();
    if (result.error) {
      return result;
    } else {
      return await this.updateEntity(id, id, values, lookups);
    }
  }

  /**
   * Execute update entity
   * @param {string} id 
   * @param {string} oldId 
   * @param {Object} values 
   * https://wit.ai/docs/http/20170307#put__entities__entity_id_link
   */
  async updateEntity(id, oldId, values, lookups = ["free-text"]) {
    id = id.trim();
    oldId = oldId.trim();
    const url = this.api + "entities/" + oldId;
    this.params = {
      id,
      doc: id,
      lookups: lookups,
      values
    };
    this.method = "put";
    this.action = "entities";
    return await this.run(url);
  }

  /**
   * Execute delete entity
   * @param {Array[string] or string} id 
   * https://wit.ai/docs/http/20170307#delete__entities__entity_id_link
   */
  async deleteEntity(id) {
    if (!Array.isArray(id)) id = [id];
    for (let i = 0; i < id.length; i++) {
      const ele = id[i].trim();
      const url = this.api + "entities/" + ele;
      this.method = "delete";
      this.action = "entities";
      const result = await this.run(url);
      if (result.error) {
        return result;
      }
    }
    return true;
  }

  /**
   * Execute Creates a new intents
   * @param {string} id 
   * https://wit.ai/docs/http/20170307#post__entities_link
   * https://wit.ai/docs/http/20170307#put__entities__entity_id_link
   */
  async createIntent(id) {
    id = id.trim();
    const url = this.api + "entities/" + this.intent;
    this.method = "get";
    this.action = "entities";
    const info = await this.run(url);
    if (info.error) {
      //intent not found >>> create intent
      return this.createEntity("intent", [{ "value": id }], ["trait"]);
    } else {
      const values = info.values;
      values.push({ "value": id });
      return await this.updateEntity("intent", "intent", values , ["trait"]);
    }
  }

  /**
   * Execute delete intent
   * @param {string} id 
   * @param {string} oldId 
   * https://wit.ai/docs/http/20170307#post__entities_link
   * https://wit.ai/docs/http/20170307#put__entities__entity_id_link
   */
  async updateIntent(id, oldId) {
    id = id.trim();
    oldId = oldId.trim();
    const url = this.api + "entities/" + this.intent;
    this.method = "get";
    this.action = "entities";
    const info = await this.run(url);
    if (!info.error) {
      const newValues = [];
      const values = info.values;
      let check = false;
      for (let i = 0; i < values.length; i++) {
        const val = values[i];
        if (val.value.trim() === oldId) {
          val.value = id;
        } else {
          if (val.value.trim() === id) {
            check = true;
          }
        }
        newValues.push(val);
      }
      if (check) {
        return {
          error: true,
          message: 'The name "'+id+'" is already used for another intent'
        };
      }
      return await this.updateEntity("intent", "intent", newValues , ["trait"]);
    }

    return false;
  }

  /**
   * Execute delete intent
   * @param {Array[string] or string} id 
   * https://wit.ai/docs/http/20170307#post__entities_link
   * https://wit.ai/docs/http/20170307#put__entities__entity_id_link
   */
  async deleteIntent(id) {
    if (!Array.isArray(id)) id = [id];
    const url = this.api + "entities/" + this.intent;
    this.method = "get";
    this.action = "entities";
    const info = await this.run(url);
    if (!info.error) {
      const newValues = [];
      const values = info.values;
      for (let i = 0; i < values.length; i++) {
        const val = values[i];
        if (id.indexOf(val.value) === -1) {
          newValues.push(val);
        }
      }
      return await this.updateEntity("intent", "intent", newValues , ["trait"]);
    }

    return false;
  }
}

module.exports = Wit;
