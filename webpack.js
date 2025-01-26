const { v4: uuidv4 } = require('uuid');
const encoding = 'utf-8';
const base64js = require('base64-js');
const openpgp = require('openpgp');
const axios = require('axios');
const { sha256 } = require('js-sha256');

str2bytes = (str1) => new TextEncoder(encoding).encode(str1)
bytes2str = (uint8Array1) => new TextDecoder(encoding).decode(uint8Array1)

bytes2base64str = (bytes1) => base64js.fromByteArray(bytes1)
base64str2bytes = (base64str1) => base64js.toByteArray(base64str1)

// Convert a string to a byte array
function stringToByteArray(str) {
  const byteArray = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    byteArray[i] = str.charCodeAt(i);
  }
  return byteArray;
}

// Convert a byte array to a string
function byteArrayToString(byteArray) {
  let str = '';
  for (let i = 0; i < byteArray.length; i++) {
    str += String.fromCharCode(byteArray[i]);
  }
  return str;
}


sym_encrypt = async (uint8Array1, password1) => {
  const message = await openpgp.createMessage({ binary: uint8Array1 });
  return await openpgp.encrypt({
      message,
      passwords: [password1],
      format: 'armored'
  })
}

sym_decrypt = async (str1, password1) => {
  const encryptedMessage = await openpgp.readMessage({
      armoredMessage: str1
  });

  res = await openpgp.decrypt({
      message: encryptedMessage,
      passwords: [password1],
      format: 'binary'
  });
  return res.data
}


gen_keys = async (username, email, password) => {
  
  const { privateKey, publicKey } = await openpgp.generateKey({
      type: 'rsa',
      rsaBits: 4096,
      userIDs: [{ name: username, email: email }],
      passphrase: password
  });

  return { private_key : privateKey, public_key : publicKey}
}

gen_keys2 = async (username, email) => {
  
  const { privateKey, publicKey } = await openpgp.generateKey({
      type: 'rsa',
      rsaBits: 4096,
      userIDs: [{ name: username, email: email }],
  });

  return { private_key : privateKey, public_key : publicKey}
}


sym_encrypt_json = async (json1, password1) => {
  json1_str = JSON.stringify(json1)
  json1_str_bytes = str2bytes(json1_str)
  return await sym_encrypt(json1_str_bytes, password1)
}

sym_decrypt_json = async (enc_text1, password1) => {
  json1_str_bytes = await sym_decrypt(enc_text1, password1)
  json1_str = bytes2str(json1_str_bytes)
  return JSON.parse(json1_str)
}

encrypt = async (public_key, bytes1) => {
  const publicKey = await openpgp.readKey({ armoredKey: public_key });
  const encrypted = await openpgp.encrypt({
      message: await openpgp.createMessage({ binary: bytes1 }), // input as Message object
      encryptionKeys: publicKey,
      format: 'armored'
  });
  return encrypted
}

decrypt = async (private_key, password1, str1) => {
  const message = await openpgp.readMessage({
      armoredMessage: str1 // parse armored message
  });

  const privateKey = await openpgp.decryptKey({
      privateKey: await openpgp.readPrivateKey({ armoredKey: private_key }),
      passphrase: password1
  });
  
  const { data: decrypted, signatures } = await openpgp.decrypt({
      message,
      decryptionKeys: privateKey,
      format: 'binary' 
  });
  return decrypted
}

decrypt2 = async (private_key, str1) => {
  const message = await openpgp.readMessage({
      armoredMessage: str1 // parse armored message
  });

  privateKey = await openpgp.readPrivateKey({ armoredKey: private_key })
  
  const { data: decrypted, signatures } = await openpgp.decrypt({
      message,
      decryptionKeys: privateKey,
      format: 'binary' 
  });
  return decrypted
}


// ---- github ----
  const get_file = async (owner, repo, token, branch, file_path) => {
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${file_path}`, 
    {
    headers: {Authorization: `token ${token}`},
    params: {ref: branch}
  })
  return response
}

  const add_upd_file = async (owner, repo, token, branch, file_path, base64_content, sha = undefined) => {
    
      commit_msg = undefined
      if (sha === undefined) {
        commit_msg = `added ${file_path}`
      }
      else {
        commit_msg = `updated ${file_path}`
      }

      const response = await axios.put(`https://api.github.com/repos/${owner}/${repo}/contents/${file_path}`, 
      {
        message: commit_msg,
        content: base64_content,
        branch: branch,
        sha:sha,
      }, 

      {
        headers: {Authorization: `token ${token}`},
        params: {ref: branch}
      });
  
      return response
  };

const del_file = async (owner, repo, token, branch, file_path, sha = undefined) => {
  const response = await axios.delete(`https://api.github.com/repos/${owner}/${repo}/contents/${file_path}`, 
    {
    headers: {Authorization: `token ${token}`},
    params: {ref: branch},
    data : {
      message: 'del file',
      branch: branch,
      sha:sha,
    }, 
  }
);

  return response
};

const get_file_list = async (owner, repo, token, branch) => {
    const response  = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/`,
      {
        headers: {
          Authorization: `token ${token}`,
        },
        params: {
          ref: branch,
        },
      }
    );

    const files = response.data.filter((item) => item.type === 'file');
    const filePaths = files.map((file) => file.path); 
    return filePaths

}

// ----github ----



// ---- UI/dom related -------------


populate_select_list = async (strings_list1, select_elem) => {
  select_elem.options.length = 0; // clear the list first
  strings_list1.forEach(string => {
    const option = document.createElement("option");
    option.value = string;
    option.text = string;
    select_elem.appendChild(option);
  });
}

wait1 = async (sec) => {
  return new Promise(resolve => setTimeout(resolve, sec*1000));
}


save_file = async (bytes1, filename) => {
  const blob = new Blob([bytes1], { type: 'application/octet-stream' });   
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a); 
  URL.revokeObjectURL(url);   
  
}

open_file_picker = async (async_cb) => {
  const input = document.createElement('input');
  input.type = 'file';

  input.addEventListener('change', () => {
    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
      const fileContent = e.target.result; 
      const uint8Array = new Uint8Array(fileContent);
      bytes1 = bytes2str(uint8Array)
      await async_cb(bytes1)
    };

    reader.readAsArrayBuffer(file); // Read as ArrayBuffer for binary data
  });

  input.click();
}

open_file_picker_cb = (file_select_elem, cb) => {

  file_select_elem.addEventListener('change', () => {
    const file = file_select_elem.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const fileContent = e.target.result; 
      const uint8Array = new Uint8Array(fileContent);
      bytes1 = bytes2str(uint8Array)
      cb(bytes1)
    };

    reader.readAsArrayBuffer(file); // Read as ArrayBuffer for binary data
  });


}

open_file_picker_async_cb = (file_select_elem, async_cb) => {

  file_select_elem.addEventListener('change', () => {
    
    if (file_select_elem.files.length > 0) {
      const file = file_select_elem.files[0];
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileContent = e.target.result; 
        const uint8Array = new Uint8Array(fileContent);
        text1 = bytes2str(uint8Array)
        await async_cb(text1)
      };
      reader.readAsArrayBuffer(file); // Read as ArrayBuffer for binary data
    }
    
  });

}


open_file_picker_wz_filename_async_cb = (file_select_elem, async_cb) => {

  file_select_elem.addEventListener('change', () => {
    
    if (file_select_elem.files.length > 0) {
      const file = file_select_elem.files[0];
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileContent = e.target.result; 
        const uint8Array = new Uint8Array(fileContent);
        text1 = bytes2str(uint8Array)
        await async_cb(file.name, text1)
      };
      reader.readAsArrayBuffer(file); // Read as ArrayBuffer for binary data
    }
    
  });

}



_get = (id1) => document.getElementById(id1)

handle_form_submit_async_cb = (form_name, async_cb ) => { 
  const form1 = document.getElementById(form_name);
  form1.addEventListener('submit', async (event) => {
    event.preventDefault();
    await async_cb(event);
  })
}

handle_click_async_cb = (elem_id, async_cb ) => { 
  const form1 = document.getElementById(elem_id);
  form1.addEventListener('click', async (event) => {
    event.preventDefault();
    await async_cb(event);
  })
}

_handle_event_async_cb = (elem_id, event_name, async_cb) => {
  const elem = document.getElementById(elem_id);
  elem.addEventListener(event_name, async (event) => {
    await async_cb(event);
  })
}

handle_enter_async_cb = (elem_id, async_cb ) => {
  const elem = document.getElementById(elem_id);
  elem.addEventListener('keypress', async (event) => {
    if (event.key === "Enter") {
      await async_cb(event);
    }    
  })
}

handle_change_async_cb = (elem_id, async_cb) => {
  _handle_event_async_cb(elem_id, 'change', async_cb)
}


const divs = ['setup_div', 'main_div', 'login_div', 'backup_div'];

show_div = (div_name) => {
  for (const div1 of divs) {
    if (div_name === div1) {
      _get(div1).classList.remove('hidden');
    }
    else {
      _get(div1).classList.add('hidden');
    }
  }
  
}


form2form_data = (form_name) => new FormData(document.getElementById(form_name))
form_data2json = (form_data) => Object.fromEntries(form_data.entries())
form2json = (form_name) => form_data2json(form2form_data(form_name))

// ---- UI/dom related -------------
validate_setup_form = async (async_cb) => {

  const password = document.getElementById('password');
  const confirmPassword = document.getElementById('confirmPassword');

  const git_password = document.getElementById('git_password');
  const git_confirm_password = document.getElementById('git_confirm_password');
  
  const git_token = document.getElementById('git_token');
  const git_confirm_token = document.getElementById('git_confirm_token');

if (password.value !== confirmPassword.value) {
    password.value = ''
    confirmPassword.value = ''
    password.focus()
    alert('Passwords do not match. Please try again.');
  } else if (git_password.value !== git_confirm_password.value) {
    git_password.value = ''
    git_confirm_password.value = ''
    git_password.focus()
    alert('Git passwords do not match. Please try again.');
} else if (git_token.value !== git_confirm_token.value) {
    git_token.value = ''
    git_confirm_token.value = ''
    git_token.focus()
    alert('Git tokens do not match. Please try again.');
} else {
  await async_cb()
}
  
}


sha256_1 = (msg) => {
  var hash = sha256.create();
  hash.update(msg);
  return hash.hex();  
}




ts1 = () => {
const now = new Date();
function strftime(format) {
  const dateObj = {
    Y: now.getFullYear(),
    m: ('0' + (now.getMonth() + 1)).slice(-2),
    d: ('0' + now.getDate()).slice(-2), 
    H: ('0' + now.getHours()).slice(-2),
    M: ('0' + now.getMinutes()).slice(-2),
    S: ('0' + now.getSeconds()).slice(-2),
  };

  return format.replace(/%([YmHdHMS])/g, (match, p1) => dateObj[p1]);
}

return strftime("%Y%m%d_%H%M%S"); 
}


// --------------- exports -------------------------------

window.uuidv4 = uuidv4
window.str2bytes = str2bytes
window.bytes2str = bytes2str
window.bytes2base64str = bytes2base64str
window.base64str2bytes = base64str2bytes
window.sym_encrypt = sym_encrypt
window.sym_decrypt = sym_decrypt
window.gen_keys = gen_keys

window.sym_encrypt_json = sym_encrypt_json
window.sym_decrypt_json = sym_decrypt_json
window.encrypt = encrypt
window.decrypt = decrypt
window.save_file = save_file
window.open_file_picker = open_file_picker
window.open_file_picker_cb = open_file_picker_cb

window.open_file_picker_async_cb = open_file_picker_async_cb
window.handle_form_submit_async_cb = handle_form_submit_async_cb
window.open_file_picker_wz_filename_async_cb = open_file_picker_wz_filename_async_cb

window.handle_click_async_cb = handle_click_async_cb
window.handle_enter_async_cb = handle_enter_async_cb
window.validate_setup_form = validate_setup_form
window.form2json = form2json
window.populate_select_list = populate_select_list

window.get_file = get_file
window.add_upd_file = add_upd_file
window.del_file = del_file
window.get_file_list = get_file_list

window._get = _get
window.show_div = show_div
window.wait1 = wait1
window.ts1 = ts1
window.sha256_1 = sha256_1

