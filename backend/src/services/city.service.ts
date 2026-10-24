import { City, ICity } from '../models/city.model';
import { User } from '../models/user.model';

function createHttpError(statusCode: number, message: string): Error & { statusCode: number } {
  return Object.assign(new Error(message), { statusCode });
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Tamil Nadu district headquarters and major towns. More can be added from the admin panel.
const TAMIL_NADU_CITIES: { name: string; aliases?: string[] }[] = [
  { name: 'Chennai', aliases: ['Madras'] },
  { name: 'Coimbatore', aliases: ['Kovai'] },
  { name: 'Madurai' },
  { name: 'Tiruchirappalli', aliases: ['Trichy', 'Tiruchi'] },
  { name: 'Salem' },
  { name: 'Tirunelveli', aliases: ['Nellai'] },
  { name: 'Tiruppur', aliases: ['Tirupur'] },
  { name: 'Erode' },
  { name: 'Vellore' },
  { name: 'Thoothukudi', aliases: ['Tuticorin'] },
  { name: 'Thanjavur', aliases: ['Tanjore'] },
  { name: 'Dindigul' },
  { name: 'Ariyalur' },
  { name: 'Chengalpattu' },
  { name: 'Cuddalore' },
  { name: 'Dharmapuri' },
  { name: 'Kallakurichi' },
  { name: 'Kanchipuram', aliases: ['Kancheepuram'] },
  { name: 'Nagercoil', aliases: ['Kanyakumari'] },
  { name: 'Karur' },
  { name: 'Krishnagiri' },
  { name: 'Mayiladuthurai' },
  { name: 'Nagapattinam' },
  { name: 'Namakkal' },
  { name: 'Udhagamandalam', aliases: ['Ooty', 'Nilgiris', 'The Nilgiris'] },
  { name: 'Perambalur' },
  { name: 'Pudukkottai' },
  { name: 'Ramanathapuram' },
  { name: 'Ranipet' },
  { name: 'Sivaganga' },
  { name: 'Tenkasi' },
  { name: 'Theni' },
  { name: 'Tirupathur' },
  { name: 'Tiruvallur', aliases: ['Thiruvallur'] },
  { name: 'Tiruvannamalai', aliases: ['Thiruvannamalai'] },
  { name: 'Tiruvarur', aliases: ['Thiruvarur'] },
  { name: 'Viluppuram', aliases: ['Villupuram'] },
  { name: 'Virudhunagar' },
  { name: 'Hosur' },
  { name: 'Kumbakonam' },
  { name: 'Avadi' },
  { name: 'Tambaram' },
  { name: 'Karaikudi' },
  { name: 'Pollachi' },
  { name: 'Sivakasi' },
  { name: 'Rajapalayam' },
  { name: 'Neyveli' },
  { name: 'Ambur' },
  { name: 'Vaniyambadi' },
  { name: 'Gudiyatham' },
  { name: 'Arakkonam' },
  { name: 'Tiruchengode' },
  { name: 'Udumalaipettai', aliases: ['Udumalpet'] },
  { name: 'Palani' },
  { name: 'Kodaikanal' },
  { name: 'Kovilpatti' },
  { name: 'Srivilliputhur' },
  { name: 'Aruppukottai' },
  { name: 'Paramakudi' },
  { name: 'Sankarankovil' },
  { name: 'Attur' },
  { name: 'Mettupalayam' },
  { name: 'Dharapuram' },
  { name: 'Gobichettipalayam', aliases: ['Gobi'] },
  { name: 'Sathyamangalam' },
  { name: 'Chidambaram' },
  { name: 'Virudhachalam', aliases: ['Vriddhachalam'] },
  { name: 'Pattukkottai' },
  { name: 'Tiruchendur' },
  { name: 'Rameswaram' },
];

export class CityService {
  async seedTamilNaduCitiesIfNeeded(): Promise<void> {
    const count = await City.countDocuments();
    if (count > 0) return;
    await City.insertMany(TAMIL_NADU_CITIES.map((c) => ({ name: c.name, aliases: c.aliases || [], state: 'Tamil Nadu' })));
    console.log(`[Seed] Added ${TAMIL_NADU_CITIES.length} Tamil Nadu cities`);
  }

  /**
   * Rename agents' free-text cities (e.g. "Trichy") to the managed city name so dropdowns and filters match
   */
  async normalizeAgentCities(): Promise<void> {
    const agents = await User.find({ role: 'agent' }, { city: 1 });
    for (const agent of agents) {
      const city = await this.findActiveCity(agent.city || '');
      if (city && city.name !== agent.city) {
        await User.updateOne({ _id: agent._id }, { city: city.name });
      }
    }
  }

  async listCities(includeInactive = false): Promise<ICity[]> {
    return City.find(includeInactive ? {} : { active: true }).sort({ name: 1 });
  }

  /**
   * Find an active city by its name or one of its aliases (case-insensitive)
   */
  async findActiveCity(name: string): Promise<ICity | null> {
    const clean = (name || '').trim();
    if (!clean) return null;
    const re = new RegExp('^' + escapeRegex(clean) + '$', 'i');
    return City.findOne({ active: true, $or: [{ name: re }, { aliases: re }] });
  }

  async createCity(data: { name: string; state?: string; aliases?: string[] }): Promise<ICity> {
    const name = (data.name || '').trim();
    if (!name) throw createHttpError(400, 'City name is required.');
    const re = new RegExp('^' + escapeRegex(name) + '$', 'i');
    if (await City.findOne({ $or: [{ name: re }, { aliases: re }] })) {
      throw createHttpError(409, `${name} already exists.`);
    }
    return City.create({
      name,
      state: data.state?.trim() || 'Tamil Nadu',
      aliases: (data.aliases || []).map((a) => a.trim()).filter(Boolean),
    });
  }

  async updateCity(id: string, data: { name?: string; active?: boolean; aliases?: string[] }): Promise<ICity> {
    const city = await City.findById(id);
    if (!city) throw createHttpError(404, 'City not found.');

    if (typeof data.name === 'string' && data.name.trim() && data.name.trim() !== city.name) {
      const oldName = city.name;
      city.name = data.name.trim();
      // Keep agents assigned to the renamed city
      await User.updateMany({ role: 'agent', city: oldName }, { city: city.name });
    }
    if (typeof data.active === 'boolean') city.active = data.active;
    if (Array.isArray(data.aliases)) city.aliases = data.aliases.map((a) => a.trim()).filter(Boolean);
    return city.save();
  }

  async deleteCity(id: string): Promise<void> {
    const city = await City.findById(id);
    if (!city) throw createHttpError(404, 'City not found.');
    const names = [city.name, ...city.aliases].map((n) => new RegExp('^' + escapeRegex(n) + '$', 'i'));
    const agentCount = await User.countDocuments({ role: 'agent', city: { $in: names } });
    if (agentCount > 0) {
      throw createHttpError(409, `${city.name} has ${agentCount} assigned agent(s). Reassign them or deactivate the city instead.`);
    }
    await city.deleteOne();
  }

  sanitize(city: ICity) {
    return {
      id: city._id.toString(),
      name: city.name,
      state: city.state,
      aliases: city.aliases,
      active: city.active,
    };
  }
}

export const cityService = new CityService();
