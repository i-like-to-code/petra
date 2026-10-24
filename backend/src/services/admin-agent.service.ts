import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/user.model';
import { cityService } from './city.service';
import { Lead, ILead } from '../models/lead.model';
import { Commission, ICommission } from '../models/commission.model';
import { AgentLocation, IAgentLocation } from '../models/agent-location.model';

// Error with an HTTP status; the error middleware returns it to the client
const httpError = (statusCode: number, message: string) => Object.assign(new Error(message), { statusCode });

export class AdminAgentService {
  /**
   * Seed default field agents only on a brand-new database (no agents at all),
   * so agents the admin deletes are not recreated.
   */
  async seedDefaultAgentsIfEmpty() {
    try {
      const agentCount = await User.countDocuments({ role: 'agent' });
      if (agentCount > 0) {
        return;
      }

      console.log('[Seed] Seeding full field agent roster for Admin Portal...');
      const defaultPasswordHash = await bcrypt.hash('agent123', 10);

      const defaultAgents = [
        {
          fullName: 'Karthik Sales Agent',
          email: 'karthik.agent@petracement.com',
          phone: '+91 98765 43212',
          role: 'agent',
          city: 'Chennai',
          agentRole: 'Senior Field Agent',
          status: 'Active On Site',
          currentSite: 'Metro Rail Extension Site (Phase 2)',
          dailyVisits: 5,
          rating: 4.9,
          passwordHash: defaultPasswordHash,
        },
        {
          fullName: 'Suresh Kumar',
          email: 'suresh.agent@petracement.com',
          phone: '+91 98401 11223',
          role: 'agent',
          city: 'Chennai',
          agentRole: 'Area Sales Agent',
          status: 'In Transit',
          currentSite: 'DLF IT Park Flyover Extension',
          dailyVisits: 3,
          rating: 4.8,
          passwordHash: defaultPasswordHash,
        },
        {
          fullName: 'Anandhan V',
          email: 'anandhan.agent@petracement.com',
          phone: '+91 98402 22334',
          role: 'agent',
          city: 'Chennai',
          agentRole: 'Delivery Coordinator',
          status: 'Client Meeting',
          currentSite: 'Prestige Bella Vista Residential',
          dailyVisits: 4,
          rating: 4.7,
          passwordHash: defaultPasswordHash,
        },
        {
          fullName: 'Murugesan K',
          email: 'murugesan.agent@petracement.com',
          phone: '+91 98421 11223',
          role: 'agent',
          city: 'Coimbatore',
          agentRole: 'Area Sales Manager',
          status: 'Active On Site',
          currentSite: 'TIDEL Park Coimbatore Phase 2',
          dailyVisits: 4,
          rating: 4.9,
          passwordHash: defaultPasswordHash,
        },
        {
          fullName: 'Dinesh Balaji',
          email: 'dinesh.agent@petracement.com',
          phone: '+91 98422 22334',
          role: 'agent',
          city: 'Coimbatore',
          agentRole: 'Field Sales Agent',
          status: 'In Transit',
          currentSite: 'Avinashi Road Elevated Highway Site',
          dailyVisits: 3,
          rating: 4.7,
          passwordHash: defaultPasswordHash,
        },
        {
          fullName: 'Muthukumar P',
          email: 'muthukumar.agent@petracement.com',
          phone: '+91 94431 11223',
          role: 'agent',
          city: 'Madurai',
          agentRole: 'Senior Field Agent',
          status: 'Active On Site',
          currentSite: 'Multi-Speciality Hospital Block',
          dailyVisits: 4,
          rating: 4.8,
          passwordHash: defaultPasswordHash,
        },
        {
          fullName: 'Selvi R',
          email: 'selvi.agent@petracement.com',
          phone: '+91 94432 22334',
          role: 'agent',
          city: 'Madurai',
          agentRole: 'Area Sales Agent',
          status: 'Client Meeting',
          currentSite: 'Anna Nagar Commercial Complex',
          dailyVisits: 3,
          rating: 4.9,
          passwordHash: defaultPasswordHash,
        },
        {
          fullName: 'Rajendran K',
          email: 'rajendran.agent@petracement.com',
          phone: '+91 98431 11223',
          role: 'agent',
          city: 'Salem',
          agentRole: 'Senior Field Agent',
          status: 'Active On Site',
          currentSite: 'Modern Textile Mill Godown Shed',
          dailyVisits: 3,
          rating: 4.8,
          passwordHash: defaultPasswordHash,
        },
        {
          fullName: 'Ramanathan M',
          email: 'ramanathan.agent@petracement.com',
          phone: '+91 94437 11223',
          role: 'agent',
          city: 'Trichy',
          agentRole: 'Senior Field Agent',
          status: 'Active On Site',
          currentSite: 'Thillai Nagar Commercial Arcade',
          dailyVisits: 3,
          rating: 4.7,
          passwordHash: defaultPasswordHash,
        },
      ];

      for (const ag of defaultAgents) {
        const existing = await User.findOne({ email: ag.email });
        if (!existing) {
          await User.create(ag);
        }
      }

      console.log('[Seed] Field agent roster seeded successfully.');
    } catch (err) {
      console.error('[Seed] Error seeding default field agents:', err);
    }
  }

  /**
   * Get overall stats for Admin Agent Management
   */
  async getStats() {
    await this.seedDefaultAgentsIfEmpty();

    const [totalAgents, activeAgents, totalLeads, convertedLeads, commissions] = await Promise.all([
      User.countDocuments({ role: 'agent' }),
      User.countDocuments({
        role: 'agent',
        status: { $in: ['Active On Site', 'In Transit', 'Client Meeting'] },
      }),
      Lead.countDocuments(),
      Lead.countDocuments({ status: 'Converted' }),
      Commission.find(),
    ]);

    let pendingCommissions = 0;
    let totalCommissionsPaid = 0;

    for (const c of commissions) {
      if (c.status === 'Paid') {
        totalCommissionsPaid += c.commissionEarned;
      } else {
        pendingCommissions += c.commissionEarned;
      }
    }

    return {
      totalAgents,
      activeAgents,
      totalLeads,
      convertedLeads,
      conversionRate: totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 40,
      pendingCommissions,
      totalCommissionsPaid,
      totalCommissionCount: commissions.length,
    };
  }

  /**
   * Get all field agents with calculated metrics
   */
  async getAgents(filter?: { search?: string; city?: string; status?: string }) {
    await this.seedDefaultAgentsIfEmpty();

    const query: any = { role: 'agent' };

    if (filter?.city && filter.city !== 'All Cities') {
      query.city = filter.city;
    }

    if (filter?.status && filter.status !== 'All') {
      query.status = filter.status;
    }

    if (filter?.search) {
      query.$or = [
        { fullName: new RegExp(filter.search, 'i') },
        { phone: new RegExp(filter.search, 'i') },
        { email: new RegExp(filter.search, 'i') },
        { city: new RegExp(filter.search, 'i') },
        { currentSite: new RegExp(filter.search, 'i') },
      ];
    }

    const agents = await User.find(query).sort({ rating: -1, createdAt: -1 });

    // Calculate lead and commission summaries per agent
    const agentData = await Promise.all(
      agents.map(async (ag) => {
        const [leadsCount, convertedCount, commissions] = await Promise.all([
          Lead.countDocuments({ agentId: ag._id }),
          Lead.countDocuments({ agentId: ag._id, status: 'Converted' }),
          Commission.find({ agentId: ag._id }),
        ]);

        const totalEarned = commissions.reduce((sum, c) => sum + c.commissionEarned, 0);

        return {
          id: ag._id,
          fullName: ag.fullName,
          email: ag.email,
          phone: ag.phone,
          city: ag.city || '',
          agentRole: ag.agentRole || 'Field Sales Agent',
          status: ag.status || 'Active On Site',
          currentSite: ag.currentSite || 'Active Project Site',
          dailyVisits: ag.dailyVisits || 0,
          rating: ag.rating || 4.8,
          leadsCount,
          convertedCount,
          totalEarned,
          createdAt: ag.createdAt,
        };
      })
    );

    return agentData;
  }

  /**
   * Create a new field agent
   */
  async createAgent(data: {
    fullName: string;
    email: string;
    phone: string;
    city?: string;
    agentRole?: string;
    currentSite?: string;
    status?: string;
    password?: string;
  }) {
    if (!data.fullName || !data.email || !data.phone) {
      throw new Error('Full name, email, and phone are required');
    }

    const existingUser = await User.findOne({ email: data.email.toLowerCase().trim() });
    if (existingUser) {
      throw new Error(`Agent with email ${data.email} already exists`);
    }

    // Agents must cover a city from the managed list; orders from that city earn them commission
    const assignedCity = await this.resolveFreeCity(data.city || '');

    const defaultPasswordHash = await bcrypt.hash((data.password && data.password.trim()) ? data.password.trim() : 'agent123', 10);

    const newAgent = await User.create({
      fullName: data.fullName.trim(),
      email: data.email.toLowerCase().trim(),
      phone: data.phone.trim(),
      role: 'agent',
      city: assignedCity.name,
      agentRole: data.agentRole?.trim() || 'Field Sales Agent',
      currentSite: data.currentSite?.trim() || 'Assigned Site',
      status: data.status || 'Active On Site',
      dailyVisits: 0,
      rating: 4.8,
      passwordHash: defaultPasswordHash,
    });

    return {
      id: newAgent._id,
      fullName: newAgent.fullName,
      email: newAgent.email,
      phone: newAgent.phone,
      city: newAgent.city,
      agentRole: newAgent.agentRole,
      status: newAgent.status,
      currentSite: newAgent.currentSite,
      dailyVisits: newAgent.dailyVisits,
      rating: newAgent.rating,
      createdAt: newAgent.createdAt,
    };
  }

  /**
   * Resolve an active city for an agent and enforce one agent per city.
   * `excludeAgentId` lets an agent keep (re-save) their own city.
   */
  private async resolveFreeCity(cityName: string, excludeAgentId?: string) {
    const city = await cityService.findActiveCity(cityName);
    if (!city) {
      throw Object.assign(new Error("Please choose the agent's city from the list of active cities"), { statusCode: 400 });
    }
    const names = [city.name, ...city.aliases].map(
      (n) => new RegExp('^' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i')
    );
    const existing = await User.findOne({
      role: 'agent',
      city: { $in: names },
      ...(excludeAgentId ? { _id: { $ne: excludeAgentId } } : {}),
    });
    if (existing) {
      throw Object.assign(
        new Error(`${city.name} already has an agent (${existing.fullName}). Each city can have only one agent.`),
        { statusCode: 409 }
      );
    }
    return city;
  }

  /**
   * Update an agent (status, site, role, etc.)
   */
  async updateAgent(
    id: string,
    data: {
      fullName?: string;
      email?: string;
      phone?: string;
      password?: string;
      status?: string;
      currentSite?: string;
      city?: string;
      agentRole?: string;
    }
  ) {
    const agent = await User.findOne({ _id: id, role: 'agent' });
    if (!agent) {
      throw httpError(404, 'Agent not found');
    }

    if (data.fullName !== undefined) {
      if (!data.fullName.trim()) throw httpError(400, 'Name cannot be empty');
      agent.fullName = data.fullName.trim();
    }
    if (data.email !== undefined) {
      const email = data.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw httpError(400, 'Enter a valid email address');
      if (email !== agent.email && (await User.exists({ email, _id: { $ne: agent._id } }))) {
        throw httpError(409, `Another account already uses ${email}`);
      }
      agent.email = email;
    }
    if (data.phone !== undefined) {
      if (!data.phone.trim()) throw httpError(400, 'Phone cannot be empty');
      agent.phone = data.phone.trim();
    }
    if (data.password) {
      // Optional password reset from the admin panel
      if (data.password.trim().length < 6) throw httpError(400, 'Password must be at least 6 characters');
      agent.passwordHash = await bcrypt.hash(data.password.trim(), 10);
    }
    if (data.status) agent.status = data.status as any;
    if (data.currentSite) agent.currentSite = data.currentSite;
    if (data.city !== undefined) {
      if (!String(data.city).trim()) {
        // Unassigned: the agent keeps their account but receives no orders or commission
        agent.city = '';
      } else {
        const assignedCity = await this.resolveFreeCity(data.city, agent._id.toString());
        agent.city = assignedCity.name;
      }
    }
    if (data.agentRole) agent.agentRole = data.agentRole;

    await agent.save();
    return this.sanitizeAgent(agent);
  }

  /**
   * Agent profile with commission totals and recent commissions (admin view)
   */
  async getAgentDetails(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw httpError(404, 'Agent not found');
    const agent = await User.findOne({ _id: id, role: 'agent' });
    if (!agent) throw httpError(404, 'Agent not found');

    const commissions = await Commission.find({ agentId: agent._id }).sort({ createdAt: -1 });
    let paid = 0;
    let pending = 0;
    let bags = 0;
    let orderValue = 0;
    for (const c of commissions) {
      if (c.status === 'Paid') paid += c.commissionEarned;
      else pending += c.commissionEarned;
      bags += c.totalBags || 0;
      orderValue += c.orderAmount || 0;
    }

    return {
      ...this.sanitizeAgent(agent),
      stats: {
        orders: commissions.length,
        bags,
        orderValue,
        totalEarned: paid + pending,
        paid,
        pending,
      },
      recentCommissions: commissions.slice(0, 10).map((c) => ({
        id: c._id.toString(),
        orderId: c.orderId,
        customerName: c.customerName,
        orderAmount: c.orderAmount,
        totalBags: c.totalBags || 0,
        commissionEarned: c.commissionEarned,
        status: c.status,
        createdAt: c.createdAt,
      })),
    };
  }

  private sanitizeAgent(agent: IUser) {
    return {
      id: agent._id.toString(),
      fullName: agent.fullName,
      email: agent.email,
      phone: agent.phone,
      city: agent.city || '',
      agentRole: agent.agentRole || 'Field Sales Agent',
      status: agent.status || 'Active On Site',
      currentSite: agent.currentSite || '',
      createdAt: agent.createdAt,
    };
  }

  /**
   * Delete an agent
   */
  async deleteAgent(id: string) {
    const deleted = await User.findOneAndDelete({ _id: id, role: 'agent' });
    if (!deleted) {
      throw new Error('Agent not found or already removed');
    }
    return { success: true, message: 'Agent removed successfully' };
  }

  /**
   * Get all customer leads across all agents
   */
  async getAllLeads(filter?: { search?: string; status?: string; location?: string }) {
    const query: any = {};

    if (filter?.status && filter.status !== 'All') {
      query.status = filter.status;
    }

    if (filter?.location && filter.location !== 'All Locations') {
      query.location = new RegExp(filter.location, 'i');
    }

    if (filter?.search) {
      query.$or = [
        { customerName: new RegExp(filter.search, 'i') },
        { phoneNumber: new RegExp(filter.search, 'i') },
        { interestedProduct: new RegExp(filter.search, 'i') },
        { location: new RegExp(filter.search, 'i') },
      ];
    }

    const leads = await Lead.find(query).populate('agentId', 'fullName email phone city').sort({ createdAt: -1 });
    return leads;
  }

  /**
   * Update a customer lead status
   */
  async updateLeadStatus(id: string, status: string) {
    const lead = await Lead.findById(id);
    if (!lead) {
      throw new Error('Customer lead not found');
    }

    lead.status = status as any;
    await lead.save();
    return lead;
  }

  /**
   * Get all commissions across all agents
   */
  async getAllCommissions(filter?: { status?: string }) {
    const query: any = {};
    if (filter?.status && filter.status !== 'All') {
      query.status = filter.status;
    }

    const commissions = await Commission.find(query)
      .populate('agentId', 'fullName email phone city')
      .sort({ createdAt: -1 });

    return commissions;
  }

  /**
   * Update commission payout status (e.g. Mark Paid / Approve)
   */
  async updateCommissionStatus(id: string, status: 'Paid' | 'Pending') {
    const commission = await Commission.findById(id);
    if (!commission) {
      throw new Error('Commission record not found');
    }

    commission.status = status;
    if (status === 'Paid') {
      commission.paidAt = new Date();
    } else {
      commission.paidAt = undefined;
    }

    await commission.save();
    return commission;
  }

  /**
   * Get Tamil Nadu city hubs tracking
   */
  async getLocations() {
    let locations = await AgentLocation.find().sort({ totalAgents: -1 });
    return locations;
  }
}

export const adminAgentService = new AdminAgentService();
