import axios from 'axios';
import FormData from 'form-data';

const linksConvert = {
    "webp-mp4": {
        "url": "https://ezgif.com/webp-to-mp4",
        "params": {},
        "req_params": [],
        "split": {
            "start": "\" controls><source src=\"",
            "end": "\" type=\"video/mp4\">Your browser"
        },
        "either_params": []
    },
    "webp-gif": {
        "url": "https://ezgif.com/webp-to-gif",
        "params": {},
        "req_params": [],
        "split": {
            "start": "<img src=\"",
            "end": "\" style=\"width:"
        },
        "either_params": []
    }
};

async function convert(fields) {
    if (typeof fields === 'string' && fields?.toLowerCase() === 'list') return Object.keys(linksConvert);

    let type = linksConvert?.[fields?.type];
    if (!type) throw new Error(`Invalid conversion type "${fields?.type}"`);
    let form = new FormData();

    if (fields?.file) {
        if (!fields.filename) throw new Error(`filename must be provided to upload files.(with extension)`);
        form.append('new-image', fields.file, {
            filename: fields.filename,
            contentType: 'image/webp'
        });
    } else if (fields?.url) {
        form.append('new-image-url', fields.url);
    } else throw new Error('Either file or url field is required.');

    delete fields.type;
    delete fields.file;
    delete fields.filename;
    delete fields.url;

    let link = await axios({
        method: 'post',
        url: type.url,
        headers: form.getHeaders(),
        data: form,
    });

    let redir = String(link?.request?.res?.responseUrl);
    if (!redir) throw new Error(`Oops! Something unknown happened!`);
    let id = redir.split('/')[redir.split('/').length - 1];
    type.params.file = id;

    let image = await axios({
        method: 'post',
        url: `${redir}?ajax=true`,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: new URLSearchParams({
            ...type.params,
            ...fields,
        }),
    });

    let img_url = `https:${(image?.data?.toString()?.split(type.split.start)?.[1]?.split(type.split.end)?.[0])?.replace('https:', '')}`;
    if (img_url.includes('undefined')) throw new Error(`Something unknown happened`);
    return img_url;
}

export { convert };
