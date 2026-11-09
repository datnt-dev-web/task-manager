/** Tên tệp an toàn cho header: bản ASCII + bản UTF-8 theo RFC 5987. */
const contentDisposition = (type, fileName) => {
  const ascii = fileName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7e]|["\\]/g, '_');
  return `${type}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
};

class AttachmentController {
  constructor({ attachmentService }) {
    this.attachmentService = attachmentService;
  }

  search = async (req, res) => {
    const { items, meta } = await this.attachmentService.search(req.user, req.valid.query);
    res.json({ data: items, meta });
  };

  list = async (req, res) => {
    res.json({ data: await this.attachmentService.list(req.user, req.valid.params.key) });
  };

  upload = async (req, res) => {
    res.status(201).json({ data: await this.attachmentService.upload(req.user, req.valid.params.key, req.files) });
  };

  download = async (req, res) => {
    const inline = ['1', 'true'].includes(req.valid.query.inline);
    const file = await this.attachmentService.openForDownload(req.user, req.valid.params.attachmentId, { inline });

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', file.size);
    res.setHeader('Content-Disposition', contentDisposition(file.inline ? 'inline' : 'attachment', file.fileName));
    res.setHeader('Cache-Control', 'private, max-age=86400');
    file.stream.on('error', () => {
      if (!res.headersSent) res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Tệp không còn tồn tại' } });
      else res.destroy();
    });
    file.stream.pipe(res);
  };

  remove = async (req, res) => {
    await this.attachmentService.remove(req.user, req.valid.params.attachmentId);
    res.status(204).end();
  };
}

module.exports = AttachmentController;
