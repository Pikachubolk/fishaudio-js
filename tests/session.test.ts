import { Session, TTSRequest, ASRRequest, HttpCodeError } from '../src';

describe('Session', () => {
  let session: Session;

  beforeEach(() => {
    session = new Session(process.env.APIKEY || '');
  });

  afterEach(async () => {
    // Cleanup
  });

  it('should perform TTS', async () => {
    const buffer: Buffer[] = [];
    for await (const chunk of session.tts(TTSRequest.parse({
      text: 'Hello, world!',
      format: 'mp3',
      latency: 'balanced'
    }))) {
      buffer.push(chunk);
    }
    expect(Buffer.concat(buffer).length).toBeGreaterThan(0);
  }, 30000);

  it('should perform ASR', async () => {
    // First get audio from TTS
    const buffer: Buffer[] = [];
    for await (const chunk of session.tts(TTSRequest.parse({
      text: 'Hello, world!',
      format: 'mp3'
    }))) {
      buffer.push(chunk);
    }
    
    // Then perform ASR
    const audioBuffer = Buffer.concat(buffer);
    const result = await session.asr(ASRRequest.parse({
      audio: audioBuffer,
      language: 'zh'
    }));
    
    expect(result.text).toBeTruthy();
  });

  it('should list models', async () => {
    const models = await session.getModels();
    expect(models.total).toBeGreaterThan(0);
  });

  it('should get model by id', async () => {
    const modelId = '7f92f8afb8ec43bf81429cc1c9199cb1';
    const model = await session.getModel(modelId);
    expect(model.id).toBe(modelId);
  });

  it('should throw on model not found', async () => {
    await expect(session.getModel('123')).rejects.toThrow(HttpCodeError);
  });

  it('should throw on invalid token', async () => {
    session = new Session('invalid');
    const generator = session.tts(TTSRequest.parse({
      text: 'Hello, world!',
      format: 'mp3'
    }));
    
    await expect(generator.next()).rejects.toThrow(HttpCodeError);
  });

  it('should get API credit', async () => {
    const credit = await session.getApiCredit();
    expect(credit).toBeDefined();
    expect(credit.credit).toBeDefined();
  });

  it('should get package', async () => {
    const pkg = await session.getPackage();
    expect(pkg).toBeDefined();
    expect(pkg.type).toBeDefined();
  });
}); 