/**
 * Project entity
 * @typedef {Object} ProjectEntity
 * @property {Number}     id           Internal (core application) ID
 * @property {String}     name         Name
 * @property {String}     description  Description
 * @property {Boolean}    important    Is this project marked as important?
 * @property {String}     source       Source of this task ("internal", "redmine", "gitlab", "jira", etc)
 * @property {Date}       createdAt    Date of creation
 * @property {Date}       updatedAt    Last update timestamp
 * @property {Date|null}  deletedAt    Removal timestamp
 */

class CattrProjects {

  /**
   * Initializes Projects resource interface
   * @param {Cattr} ctx Base class context
   */
  constructor(ctx) {

    this.$ = ctx;

  }

  /**
   * Format raw task object into usable form
   * @param {Object} raw Raw task
   * @returns {ProjectEntity}
   */
  static represent(raw) {

    return {

      id: raw.id,
      name: raw.name,
      description: raw.description,
      important: Boolean(raw.important),
      source: String(raw.source),
      createdAt: new Date(raw.created_at),
      updatedAt: new Date(raw.updated_at),
      deletedAt: raw.deleted_at ? new Date(raw.deleted_at) : null

    };

  }

  /**
   * Returns list of projects
   * @async
   * @param {Object} [opts] Filtering options according to API documentation
   * @returns {Promise<Array<ProjectEntity>>}
   */
  async list(opts) {

    if (opts && typeof opts !== 'object')
      throw new TypeError(`Projects filtering options must be an Object, but ${typeof opts} given`);

    const res = await this.$.post('projects/list', opts || {}, { noPaginate: true });
    if (!res.success) {

      if (res.isNetworkError)
        throw new this.$.NetworkError(res);

      throw new this.$.ApiError(
        res.error.response.status,
        res.error.response.data.error_type || 'unknown',
        res.error.response.data.message || 'Unknown message',
      );

    }

    return res.response.data.map(CattrProjects.represent);

  }

}

module.exports = CattrProjects;
