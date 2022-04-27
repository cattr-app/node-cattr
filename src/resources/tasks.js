/**
 * Data object representing task
 * @typedef {Object} TaskEntity
 * @property {Number} id ID
 * @property {Number} projectId ID of associated project
 * @property {String} name Task subject
 * @property {String} description Task description
 * @property {Boolean} isActive Is task active?
 * @property {Boolean} isImportant Is this task important?
 * @property {String|null} url Direct link to the task
 * @property {Number} assigneeId Identifier of user, assigned to this task
 * @property {Number} assignedById Who assigned this task?
 * @property {Number} priorityId ID of this task priority
 * @property {Date} createdAt Date of creation
 * @property {Date} updatedAt Last update timestmap
 * @property {Date|null} deletedAt Timestamp of removal
 */

class CattrTasks {

  /**
   * Initializes Tasks resource interface
   * @param {Cattr} ctx Base class context
   */
  constructor(ctx) {

    this.$ = ctx;

  }

  /**
   * Format raw task object into usable form
   * @param {Object} raw Raw task
   * @returns {TaskEntity}
   */
  static represent(raw) {

    return {

      id: Number(raw.id),
      projectId: Number(raw.project_id),
      name: String(raw.task_name),
      description: String(raw.description),
      url: (raw.url && raw.url !== 'url') ? String(raw.url) : null,
      isActive: Boolean(raw.active),
      isImportant: Boolean(raw.important),
      assigneeId: Number(raw.user_id),
      assignedById: Number(raw.assigned_by),
      priorityId: Number(raw.priority_id),
      createdAt: new Date(raw.created_at),
      updatedAt: new Date(raw.updated_at),
      deletedAt: raw.deleted_at ? new Date(raw.deleted_at) : null

    };

  }

  /**
   * Returns list of tasks
   * @async
   * @param {Object} [opts] Filtering options according to API documentation
   * @returns {Promise<Array<TaskEntity>>}
   */
  async list(opts) {

    if (opts && typeof opts !== 'object')
      throw new TypeError(`Tasks filtering options must be an Object, but ${typeof opts} given`);

    const res = await this.$.post('tasks/list', opts || {}, { noPaginate: true });
    if (!res.success) {

      if (res.isNetworkError)
        throw new this.$.NetworkError(res);

      throw new this.$.ApiError(
        res.error.response.status,
        res.error.response.data.error_type || 'unknown',
        res.error.response.data.message || 'Unknown message',
      );

    }

    return res.response.data;

  }

  async create(opts) {

    if (opts && typeof opts !== 'object')
      throw new TypeError(`Properties of the new task must be passed as Object, but ${typeof opts} given`);

    const res = await this.$.post('tasks/create', opts || {});
    if (!res.success) {

      if (res.isNetworkError)
        throw new this.$.NetworkError(res);

      throw new this.$.ApiError(
        res.error.response.status,
        res.error.response.data.error_type || 'unknown',
        res.error.response.data.message || 'Unknown message',
      );

    }

    return res.response.data;

  }

}

module.exports = CattrTasks;
