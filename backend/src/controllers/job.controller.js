const BaseController = require("./baseController");
const Job = require("../models/Job");
const JobResponse = require("../models/JobResponse");
const responses = require("../http/response");
const { Op } = require("sequelize");

class JobController extends BaseController {
  constructor() {
    super(Job, { searchFields: ["title", "description", "department"], filterFields: ["status", "created_by"] });
  }

  // override list to filter by business is_active status (only show jobs from active businesses)
  async list(req, res) {
    try {
      const limit = parseInt(req.query.limit) || this.defaultLimit;
      const offset = parseInt(req.query.offset) || 0;
      const search = req.query.search || null;
      const ordering = req.query.ordering || null;

      const where = {};

      // Search functionality
      if (search && this.searchFields.length > 0) {
        where[Op.or] = this.searchFields.map((field) => ({
          [field]: { [Op.like]: `%${search}%` },
        }));
      }

      // filtering
      this.filterFields.forEach((field) => {
        if (req.query[field]) {
          where[field] = req.query[field];
        }
      });

      // ordering
      let order = this.defaultOrder;
      if (ordering) {
        const orderFields = ordering.split(',');
        order = orderFields.map((field) => {
          if (field.startsWith('-')) {
            return [field.substring(1), 'DESC'];
          }
          return [field, 'ASC'];
        });
      }

      // Include BusinessAccount to filter by is_active
      const User = require("../models/User");
      const BusinessAccount = require("../models/BusinessAccount");
      
      const { count, rows } = await this.model.findAndCountAll({
        where,
        limit,
        offset,
        order,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id'],
            required: true,
            include: [
              {
                model: BusinessAccount,
                as: 'businessAccount',
                attributes: ['is_active'],
                required: true,
                where: { is_active: true }
              }
            ]
          }
        ]
      });
      console.log("THis is rows",rows)

      res.json({
        total: count,
        limit,
        offset,
        results: rows,
        next: offset + limit < count ? offset + limit : null,
        previous: offset - limit >= 0 ? offset - limit : null,
      });
    } catch (err) {
      console.error("Error listing jobs:", err);
      res.status(500).json({ error: err.message });
    }
  }

  // override create to set created_by from authenticated user and prevent duplicate titles per business
  async create(req, res) {
    try {
      const user = req.user;
      //   if (!user) return responses.unauthorized(res, "Authentication required");

      console.log("Create Job request body:", req.body);
      const body = { ...(req.body || {}) };
      const title = body.jobTitle || body.title;
      if (!title) return responses.badRequest(res, {}, "Job title is required");

      // prevent duplicate title for same business (created_by)
      const existing = await Job.findOne({ where: { title, created_by: 24 } });
      if (existing) return responses.conflict(res, {}, "A job with that title already exists for your account");

      const payload = {
        title,
        description: body.description || null,
        requirements: body.requirements || null,
        department: body.department || null,
        preferred_location: body.preferredLocation || body.preferred_location || null,
        address: body.address || null,
        work_type: body.workType || body.work_type || null,
        salary_min: body.salaryMin || body.salary_min || null,
        salary_max: body.salaryMax || body.salary_max || null,
        pay_type: body.payType || body.pay_type || null,
        benefits: body.benefits || null,
        contact_email: body.contactEmail || body.contact_email || null,
        contact_phone: body.contactPhone || body.contact_phone || null,
        application_link: body.applicationLink || body.application_link || null,
        application_deadline: body.applicationDeadline || body.application_deadline || null,
        required_documents: body.requiredDocuments || body.required_documents || null,
        created_by: user.id,
      };
      console.log("Creating Job with payload:", payload);

      const item = await this.model.create(payload);
      return responses.created(res, item, "Job created successfully");
    } catch (err) {
      console.error("Error creating Job:", err);
      // handle unique constraint DB-level error gracefully
      if (err.name === "SequelizeUniqueConstraintError") {
        return responses.conflict(res, {}, "Job title must be unique for your account");
      }
      responses.serverError(res, err.message);
    }
  }

  // override update to enforce ownership or admin and prevent duplicate titles when changing title
  async update(req, res) {
    try {
      const user = req.user;
      if (!user) return responses.unauthorized(res, "Authentication required");
      const item = await this.model.findByPk(req.params.id);
      if (!item) return responses.notFound(res, "Job not found");
      if (item.created_by !== user.id && !(req.roles || []).includes("admin")) return responses.forbidden(res, "Not authorized to edit this job");

      const body = { ...(req.body || {}) };
      // if changing title, ensure uniqueness for this creator
      const newTitle = body.jobTitle || body.title;
      if (newTitle && newTitle !== item.title) {
        const existing = await Job.findOne({ where: { title: newTitle, created_by: item.created_by, id: { [Op.ne]: item.id } } });
        if (existing) return responses.conflict(res, {}, "Another job with that title already exists for your account");
      }

      const updatePayload = {
        ...(body.jobTitle ? { title: body.jobTitle } : {}),
        ...(body.title ? { title: body.title } : {}),
        ...(body.description ? { description: body.description } : {}),
        ...(body.requirements ? { requirements: body.requirements } : {}),
        ...(body.department ? { department: body.department } : {}),
        ...(body.preferredLocation ? { preferred_location: body.preferredLocation } : {}),
        ...(body.address ? { address: body.address } : {}),
        ...(body.workType ? { work_type: body.workType } : {}),
        ...(body.salaryMin ? { salary_min: body.salaryMin } : {}),
        ...(body.salaryMax ? { salary_max: body.salaryMax } : {}),
        ...(body.payType ? { pay_type: body.payType } : {}),
        ...(body.benefits ? { benefits: body.benefits } : {}),
        ...(body.contactEmail ? { contact_email: body.contactEmail } : {}),
        ...(body.contactPhone ? { contact_phone: body.contactPhone } : {}),
        ...(body.applicationLink ? { application_link: body.applicationLink } : {}),
        ...(body.applicationDeadline ? { application_deadline: body.applicationDeadline } : {}),
        ...(body.requiredDocuments ? { required_documents: body.requiredDocuments } : {}),
      };

      await item.update(updatePayload);
      return responses.updated(res, item, "Job updated successfully");
    } catch (err) {
      console.error("Error updating Job:", err);
      if (err.name === "SequelizeUniqueConstraintError") return responses.conflict(res, {}, "Job title must be unique for your account");
      responses.serverError(res, err.message);
    }
  }

  async delete(req, res) {
    try {
      const user = req.user;
      if (!user) return responses.unauthorized(res, "Authentication required");
      const item = await this.model.findByPk(req.params.id);
      if (!item) return responses.notFound(res, "Job not found");
      if (item.created_by !== user.id && !(req.roles || []).includes("admin")) return responses.forbidden(res, "Not authorized to delete this job");
      await item.destroy();
      return responses.deleted(res, {}, "Job deleted successfully");
    } catch (err) {
      console.error("Error deleting Job:", err);
      responses.serverError(res, err.message);
    }
  }

  // Business-specific listing: returns jobs created by authenticated business with optional search and filters and attached responses
  async businessList(req, res) {
    try {
      const user = req.user;
      if (!user) return responses.unauthorized(res, "Authentication required");

      const { title, dateFrom, dateTo, responseStatus, page = 1, limit = 20, sort = "createdAt", order = "DESC" } = req.query;
      const where = { created_by: user.id };
      if (title) where.title = { [Op.iLike]: `%${title}%` };
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
        if (dateTo) where.createdAt[Op.lte] = new Date(dateTo);
      }

      const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
      const { count, rows } = await this.model.findAndCountAll({ where, limit: parseInt(limit), offset, order: [[sort, order]] });

      // fetch responses for these jobs
      const jobIds = rows.map(r => r.id);
      let responsesList = [];
      if (jobIds.length > 0) {
        const respWhere = { job_id: { [Op.in]: jobIds } };
        if (responseStatus) respWhere.status = responseStatus;
        responsesList = await JobResponse.findAll({ where: respWhere, order: [["createdAt", "DESC"]] });
      }

      // attach responses to their jobs
      const jobsWithResponses = rows.map(job => {
        const j = job.toJSON();
        j.responses = responsesList.filter(r => r.job_id === job.id).map(r => r.toJSON ? r.toJSON() : r);
        return j;
      });

      return responses.success(res, { total: count, page: parseInt(page), limit: parseInt(limit), data: jobsWithResponses }, "Business jobs fetched");
    } catch (err) {
      console.error("Error fetching business jobs:", err);
      responses.serverError(res, err.message);
    }
  }

  // Retrieve job with responses attached (public read)
  async retrieveWithResponses(req, res) {
    try {
      const job = await this.model.findByPk(req.params.id);
      if (!job) return responses.notFound(res, "Job not found");
      const responses_data = await JobResponse.findAll({ where: { job_id: job.id }, order: [["createdAt", "DESC"]] });
      const jobObj = job.toJSON();
      jobObj.responses = responses_data.map(r => r.toJSON ? r.toJSON() : r);
      return responses.success(res, jobObj, "Job fetched");
    } catch (err) {
      console.error("Error fetching job with responses:", err);
      responses.serverError(res, err.message);
    }
  }

  // Apply to job (create JobResponse)
  async apply(req, res) {
    try {
      const { user_id, cover_letter, desired_position, years_experience, availability_days, expected_pay, portfolio_url, linkedin_url } = req.body;
      const job_id = req.params.id;
      
      if (!user_id || !job_id) return responses.badRequest(res, {}, "user_id and job_id are required");
      
      const job = await this.model.findByPk(job_id);
      if (!job) return responses.notFound(res, "Job not found");
      
      // prevent duplicate applications
      const existing = await JobResponse.findOne({ where: { job_id, user_id } });
      if (existing) return responses.conflict(res, {}, "You have already applied to this job");
      
      // Handle resume upload
      let resume_url = null;
      if (req.file) {
        const path = require("path");
        const fs = require("fs").promises;
        const UPLOAD_DIR = path.join(__dirname, "../../uploads/resumes");
        
        try {
          await fs.mkdir(UPLOAD_DIR, { recursive: true });
          
          const timestamp = Date.now();
          const random = Math.random().toString(36).substring(7);
          const ext = path.extname(req.file.originalname);
          const filename = `${user_id}-${job_id}-${timestamp}-${random}${ext}`;
          const filepath = path.join(UPLOAD_DIR, filename);
          
          await fs.writeFile(filepath, req.file.buffer);
          resume_url = `/uploads/resumes/${filename}`;
        } catch (uploadErr) {
          console.error("Error uploading resume:", uploadErr);
          return responses.serverError(res, {}, "Failed to upload resume");
        }
      }
      
      const appResp = await JobResponse.create({
        job_id,
        user_id,
        cover_letter: cover_letter || null,
        resume_url,
        desired_position: desired_position || null,
        years_experience: years_experience ? parseInt(years_experience) : null,
        availability_days: availability_days ? parseInt(availability_days) : null,
        expected_pay: expected_pay ? parseFloat(expected_pay) : null,
        portfolio_url: portfolio_url || null,
        linkedin_url: linkedin_url || null,
        status: "pending"
      });
      
      return responses.created(res, appResp, "Application submitted");
    } catch (err) {
      console.error("Error applying to job:", err);
      responses.serverError(res, err.message);
    }
  }
}

module.exports = new JobController();
