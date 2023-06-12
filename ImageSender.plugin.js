/**
 * @name ImageSenderV2
 * @author CriosChan
 * @authorLink https://github.com/CriosChan/
 * @description This plugin allows you to easily send an image from your PC, like memes for example!
 * @version 0.0.5
 * @invite R7vuNSv
 * @authorid 328191996579545088
 * @updateUrl https://raw.githubusercontent.com/CriosChan/ImageSender/main/ImageSender.plugin.js
 * @website https://github.com/CriosChan/
 * @source https://github.com/CriosChan/ImageSender
 */

module.exports = (meta) => {
  ////////////////////////////////////
  /////                          /////
  /////           Utils          /////
  /////                          /////
  ////////////////////////////////////
  function delay(time) {
    return new Promise(function (resolve) {
      setTimeout(resolve, time);
    });
  }

  function dataURLtoFile(dataurl, filename) {
    var arr = dataurl.split(","),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  function getModule(filter, searchOptions) {
    return BdApi.Webpack.getModule((...args) => {
      try {
        return filter(...args);
      } catch (ignored) {
        return false;
      }
    }, searchOptions);
  }

  function contains(target, pattern) {
    var value = 0;
    pattern.forEach(function (word) {
      value = value + target.includes(word);
    });
    return value > 0;
  }

  function generateChecksum(str, algorithm, encoding) {
    return crypto
      .createHash(algorithm || "sha256")
      .update(str, "utf8")
      .digest(encoding || "hex");
  }

  function createMessage(message_content = "", image = "") {
    const container = document.createElement("div");
    container.id = "imagesender_message";
    const message = document.createElement("div");
    message.className = "emptyText-mZZyQk";
    message.textContent = message_content;
    const svg = document.createElement("div");
    svg.style.backgroundImage = `url(${image})`;
    svg.style.backgroundSize = "contain";
    svg.style.backgroundRepeat = "no-repeat";
    svg.style.backgroundPosition = "center";
    container.append(svg, message);
    return container;
  }

  ////////////////////////////////////
  /////                          /////
  /////    ZeresPluginLibrary    /////
  /////                          /////
  ////////////////////////////////////
  const fs = require("fs");
  console.log(
    fs.existsSync(BdApi.Plugins.folder + "\\0PluginLibrary.plugin.js")
  );
  if (
    !BdApi.Plugins.get("ZeresPluginLibrary") &&
    !fs.existsSync(BdApi.Plugins.folder + "\\0PluginLibrary.plugin.js")
  ) {
    return {
      start: () => {
        BdApi.showConfirmationModal(
          "Library Missing",
          `The library plugin needed for ${meta.name} is missing. Please click Download Now to install it.`,
          {
            confirmText: "Download Now",
            cancelText: "Cancel",
            onConfirm: () => {
              require("request").get(
                "https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js",
                async (err, res, body) => {
                  if (err) return;
                  await new Promise((r) =>
                    fs.writeFile(
                      require("path").join(
                        BdApi.Plugins.folder,
                        "0PluginLibrary.plugin.js"
                      ),
                      body,
                      r
                    )
                  ).then(async () => {
                    await delay(1000);
                    BdApi.Plugins.reload(meta.name);
                  });
                }
              );
            },
          }
        );
      },
      stop: () => {},
    };
  }

  ////////////////////////////////////
  /////                          /////
  /////          Modules         /////
  /////                          /////
  ////////////////////////////////////

  const { DiscordSelectors, DOMTools, Settings } =
    BdApi.Plugins.get("ZeresPluginLibrary").instance.Library;
  const { Switch, Textbox } = Settings;
  const cloudUploader = getModule((module) => {
    return Object.values(module).some((value) => {
      if (typeof value !== "object" || value === null) return false;
      const curValue = value;

      return (
        curValue.NOT_STARTED !== undefined &&
        curValue.UPLOADING !== undefined &&
        module.n !== undefined
      );
    });
  });
  const uploader = BdApi.findModuleByProps("instantBatchUpload");
  const message_sender = BdApi.findModuleByProps("_sendMessage");
  const crypto = require("crypto");
  const path = require("path");

  ////////////////////////////////////
  /////                          /////
  /////         SETTINGS         /////
  /////                          /////
  ////////////////////////////////////
  const settings_default = {
    nitroUser: false,
    saveLink: false,
    folders: [],
    savedLinks: [],
  };
  let settings = {};

  ////////////////////////////////////
  /////                          /////
  /////     Global Variables     /////
  /////                          /////
  ////////////////////////////////////
  let loaded_folders = [];
  let hidden = {};

  ////////////////////////////////////
  /////                          /////
  /////       Plugin Events      /////
  /////                          /////
  ////////////////////////////////////

  const navbar_button_compatibility = (e) => {
    let node = null;
    //Security to avoid putting the "selected" class on the navbar
    if (e.target.nodeName.toLowerCase() == "button") {
      node = e.target;
    } else if (e.target.className.includes("contents")) {
      node = e.target.parentElement;
    } else if (e.target.parentElement.className.includes("contents")) {
      node = e.target.parentElement.parentElement;
    }

    const navButtonActive_class = remove_selected(
      document.querySelector("#imagesender-picker-tab")
    );
    if (document.querySelector("#imagesender-picker-tab-panel") != null) {
      document.querySelector("#imagesender-picker-tab-panel").style.display =
        "none";
    }
    node.parentElement.parentElement.parentElement.lastChild.style.display =
      null;
    if (!node.className.includes(navButtonActive_class))
      node.className += " " + navButtonActive_class;
  };

  const reactions_picker_event = () => {
    create_UI(false);
  };

  const image_swipe_load = () => {
    const body = document.querySelector("#imagesender_body");
    const scrollTop = body.scrollTop;
    const scrollHeight = body.scrollHeight;
    const clientHeight = body.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight) {
      generateimages(
        body,
        document.querySelector("#imagesender_searchBar").querySelector("input")
          .value,
        body.querySelectorAll(".imagesender_buttons").length
      );
    }
  };

  ////////////////////////////////////
  /////                          /////
  /////     Plugin Functions     /////
  /////                          /////
  ////////////////////////////////////
  function createSettings(settingsPanel) {
    const nitroUserSwitch = new Switch(
      "Enable Nitro support",
      "Allows you to send larger files",
      settings.nitroUser,
      (checked) => {
        settings.nitroUser = checked;
        BdApi.saveData(meta.name, "settings", settings);
      }
    );

    const saveLinkSwitch = new Switch(
      "[ALPHA] Save Link on send",
      "Saves the link of the image you just sent, to later use this link instead of doing an upload. Theoretically more ecological.",
      settings.saveLink,
      (checked) => {
        settings.saveLink = checked;
        BdApi.saveData(meta.name, "settings", settings);
      }
    );

    const folders_settings = document.createElement("div");
    folders_settings.className = "settings";

    const folders_label = document.createElement("label");
    folders_label.className = "title-2yADjX";
    folders_label.textContent = "Folders :";

    folders_settings.append(folders_label);
    try {
      settings.folders.forEach((element, i) => {
        const trash_html = `<button class="bd-button bd-addon-button bd-button-danger"><svg class="" fill="#FFFFFF" viewBox="0 0 24 24" style="width: 20px; height: 20px;"><path fill="none" d="M0 0h24v24H0V0z"></path><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"></path><path fill="none" d="M0 0h24v24H0z"></path></svg></button>`;
        const trash_button = DOMTools.createElement(trash_html);
        const container = document.createElement("div");
        trash_button.addEventListener("click", () => {
          container.remove();
          settings.folders.splice(i, 1);
          BdApi.saveData(meta.name, "settings", settings);
          settingsPanel.innerHTML = "";
          createSettings(settingsPanel);
          check_folders();
        });

        container.className = "container";
        const name = new Textbox("Name", "", element.name, (changes) => {
          settings.folders[i].name = changes;
          BdApi.saveData(meta.name, "settings", settings);
          check_folders();
        });

        const path = new Textbox("Path", "", element.path, (changes) => {
          settings.folders[i].path = changes;
          BdApi.saveData(meta.name, "settings", settings);
          check_folders();
        });
        container.append(name.getElement(), path.getElement(), trash_button);
        folders_settings.append(container);
      });
    } catch {}
    const add_html = `<button type="button" class="button-ejjZWC lookFilled-1H2Jvj colorBrand-2M3O3N sizeSmall-3R2P2p grow-2T4nbg"><div class="contents-3NembX">Add Folder</div></button>`;
    const add_button_el = DOMTools.createElement(add_html);
    add_button_el.addEventListener("click", () => {
      settings.folders.push({ name: "", path: "" });
      settingsPanel.innerHTML = "";
      createSettings(settingsPanel);
    });
    folders_settings.append(add_button_el);

    settingsPanel.append(
      nitroUserSwitch.getElement(),
      saveLinkSwitch.getElement(),
      folders_settings
    );
  }

  function check_folders() {
    _loaded_folders = [];
    settings.folders.forEach((folder) => {
      BdApi.showToast(`[${meta.name}] Working on ${folder.name}`);
      if (fs.existsSync(folder.path)) {
        _loaded_folders.push(folder);
        BdApi.showToast(`[${meta.name}] ${folder.name} loaded with success !`, {
          type: "success",
        });
      } else {
        BdApi.showToast(`[${meta.name}] ${folder.name} doesn't exist !`, {
          type: "error",
        });
      }
    });
    loaded_folders = [];
    Object.assign(loaded_folders, _loaded_folders);
  }

  //Add UI button to textarea
  function add_button() {
    document.querySelectorAll("#ImageSender_UI_Button").forEach((element) => {
      element.remove();
    });
    //If not allowed to send a message, do not display the button
    if (
      !document
        .querySelector(DiscordSelectors.Textarea.buttons)
        .parentElement.className.includes("Disabled")
    ) {
      const ui_opener = document.createElement("button");
      ui_opener.id = "ImageSender_UI_Button";
      ui_opener.addEventListener("click", () => {
        open_ui();
      });
      document
        .querySelector(DiscordSelectors.Textarea.buttons)
        .append(ui_opener);
    }

    //Generate UI to reaction picker
    document
      .querySelectorAll(".expression-picker-chat-input-button")
      .forEach((node) => {
        node.addEventListener("click", reactions_picker_event);
      });
  }

  function open_ui() {
    const emoji_button = document.querySelector("button[class*=emojiButton]");
    emoji_button.click();
    create_UI(true);
  }

  function remove_selected(selected) {
    const navButtonActive_class = selected.className
      .split(" ")
      .filter((name) => name.includes("navButtonActive"))
      .toString();
    selected.className = selected.className.replace(navButtonActive_class, "");
    return navButtonActive_class;
  }

  function create_images_button(channelID, path, name, ext) {
    const button = document.createElement("button");
    button.className = "imagesender_buttons";
    const data = fs.readFileSync(path + "\\" + name, { encoding: "base64" });
    const background = "data:image/" + ext + ";base64," + data;
    button.style.backgroundImage = `url(${background})`;

    button.addEventListener("click", async () => {
      let checksum = await generateChecksum(data);
      let link = settings.savedLinks[checksum];
      if (link) {
        const message_settings = {
          content: link,
          tts: false,
          invalidEmojis: [],
          validNonShortcutEmojis: [],
        };
        message_sender.sendMessage(channelID, message_settings);
      } else {
        const upload = new cloudUploader.n(
          {
            file: dataURLtoFile(background, `${name}`),
            platform: 1,
          },
          channelID
        );

        const upload_settings = {
          channelId: channelID,
          uploads: [upload],
          draftType: 0,
          parsedMessage: {
            channel_id: channelID,
            content: "",
            tts: false,
            invalidEmojis: [],
          },
        };

        uploader.uploadFiles(upload_settings);

        if (settings.saveLink) {
          const observer = new MutationObserver((mutationList, observer) => {
            for (const mutation of mutationList) {
              if (
                mutation.type === "childList" &&
                mutation.addedNodes.length > 0
              ) {
                if (
                  mutation.addedNodes[0].querySelector("a[class*=originalLink]")
                ) {
                  settings.savedLinks[checksum] =
                    mutation.addedNodes[0].querySelector(
                      "a[class*=originalLink]"
                    ).href;
                  BdApi.saveData(meta.name, "settings", settings);
                  observer.disconnect();
                }
              }
            }
          });

          observer.observe(
            document.querySelector("ol[data-list-id=chat-messages]"),
            { childList: true }
          );
        }
      }
    });
    return button;
  }

  async function generateimages(body, search = "", offset = 0) {
    if (loaded_folders.length == 0) {
      body.innerHTML = "";
      body.append(
        createMessage(
          "Hmm... You didn't give a folder in the settings",
          "https://raw.githubusercontent.com/CriosChan/ImageSender/main/require/folder.svg"
        )
      );
    }

    const conditions = [
      search.toLowerCase(),
      search.toLowerCase().replaceAll(" ", "_"),
      search.toLowerCase().replaceAll("_", " "),
    ];
    if (offset == 0 && search != "") {
      body.innerHTML = "";
    }
    let added = 0;
    for (const folder of loaded_folders) {
      const folder_content = fs.readdirSync(folder.path, {
        withFileTypes: true,
      });

      let filecontainer = null;
      if (!document.querySelector(`#${folder.name.replaceAll(" ", "-")}`)) {
        let { hide_container_button, filecontainer_temp } = create_container(
          folder.name.replaceAll(" ", "-"),
          folder_content.length
        );
        filecontainer = filecontainer_temp;
        body.append(hide_container_button, filecontainer);
      } else {
        filecontainer = document.querySelector(
          `#${folder.name.replaceAll(" ", "-")}`
        );
        hide_container_button = document.querySelector(
          `#${folder.name.replaceAll(" ", "-")}-hide`
        );
      }

      let emergency_load = false;
      if (hidden[folder.name.replaceAll(" ", "-")]) {
        console.log(hidden[folder.name.replaceAll(" ", "-")].isHidden)
        if (hidden[folder.name.replaceAll(" ", "-")].isHidden) {
          offset =
            offset -
            filecontainer.querySelectorAll(".imagesender_buttons").length;
          continue;
        } else {
          emergency_load = true;
          hidden[folder.name.replaceAll(" ", "-")] = null;
        }
      }

      if (folder_content.length <= offset) {
        offset = offset - folder_content.length;
        continue;
      }
      let channelID = BdApi.findModuleByProps(
        "getLastSelectedChannelId"
      ).getChannelId();
      let index = 0;
      for (const file of folder_content) {
        if (index < offset) {
          index++;
          continue;
        }
        if (added > 11 && emergency_load == false) break;
        const ext = path.extname(file.name).toLowerCase().replace(".", "");
        if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext)) {
          if (
            (search != "" && contains(file.name.toLowerCase(), conditions)) ||
            search == ""
          ) {
            index++;
            added++;

            filecontainer.append(
              create_images_button(channelID, folder.path, file.name, ext)
            );
            await new Promise((resolve) => setTimeout(resolve, 0));
          }
        }
      }
      if (filecontainer.children.length == 0) {
        hide_container_button.remove();
        filecontainer.remove();
      }
      if (added > 11 || emergency_load == true) {
        break;
      } else {
        offset = 0;
        continue;
      }
    }
  }

  function create_container(name, length) {
    //Button to hide container
    const hide_container_button = document.createElement("div");
    hide_container_button.className =
      "header-1XpmZs interactive-MpGq2z imagesender_hide_container";
    hide_container_button.id = `${name}-hide`;
    const text = document.createElement("span");
    text.className = "headerLabel-1g790w";
    text.textContent = `${name} (${length})`;
    hide_container_button.infos_length = length;
    const svg = DOMTools.createElement(
      `<svg class="arrow-2HswgU headerCollapseIcon-3WeMjJ" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M16.59 8.59004L12 13.17L7.41 8.59004L6 10L12 16L18 10L16.59 8.59004Z"></path></svg>`
    );

    const filecontainer = document.createElement("div");
    filecontainer.id = name;
    filecontainer.className = "imagesender_filecontainer";

    hide_container_button.append(text, svg);
    let body = document.querySelector("#imagesender_body")
    hide_container_button.addEventListener("click", () => {
      if (filecontainer.style.display == "none") {
        svg.classList.remove("headerCollapseIconCollapsed-3C20LE");
        filecontainer.style.display = "grid";
        hidden[name] = {}
        hidden[name].isHidden = false;
        generateimages(
          body,
          document
            .querySelector("#imagesender_searchBar")
            .querySelector("input").value,
          body.querySelectorAll(".imagesender_buttons").length
        );
      } else {
        svg.classList.add("headerCollapseIconCollapsed-3C20LE");
        filecontainer.style.display = "none";
        hidden[name] = {}
        hidden[name].isHidden = true;
        generateimages(
          body,
          document
            .querySelector("#imagesender_searchBar")
            .querySelector("input").value,
          body.querySelectorAll(".imagesender_buttons").length
        );
      }
    });

    return { hide_container_button, filecontainer_temp: filecontainer };
  }

  async function create_UI(open) {
    await delay(200);

    if (open || document.querySelector("#imagesender-picker-tab")) {
      await delay(100);
      document.querySelector("#imagesender-picker-tab").click();
      return;
    }

    const emoji_picker = document.querySelector("button[id=emoji-picker-tab]");
    const pickers = emoji_picker.parentElement;

    const imagesender_picker = emoji_picker.cloneNode(true);
    imagesender_picker.firstChild.textContent = "ImageSender";
    imagesender_picker.id = "imagesender-picker-tab";

    //Deselects the button if you click on another button in the list
    pickers.childNodes.forEach((node) => {
      node.addEventListener("click", navbar_button_compatibility);
    });

    remove_selected(imagesender_picker);

    imagesender_picker.addEventListener("click", () => {
      //Picker element
      const full_UI = pickers.parentElement.parentElement;
      //Actual opened panel (emoji for exemple)
      const panel = full_UI.lastChild;
      panel.style.display = "none";
      if (document.querySelector("#imagesender-picker-tab-panel")) {
        document.querySelector("#imagesender-picker-tab-panel").style.display =
          null;
        return;
      }
      const actually_selected = document.querySelector(
        "button[class*=navButtonActive]"
      );
      const navButtonActive_class = Array.from(actually_selected.classList)
        .filter((name) => name.includes("navButtonActive"))
        .toString();

      //Deselect selected
      remove_selected(actually_selected);

      //Select ImageSender
      imagesender_picker.className =
        imagesender_picker.className + " " + navButtonActive_class;

      //Prepare search bar
      const imagesender_searchBar = panel
        .querySelector("div[class*=searchBar-]")
        .cloneNode(true);
      imagesender_searchBar.id = "imagesender_searchBar";

      //Ui reconstruction
      const panel_content = document.createElement("div");
      panel_content.id = "imagesender-picker-tab-panel";
      panel_content.setAttribute("class", "container-3u7RcY");

      const header = document.createElement("div");
      header.className = "header-2TLOnc";

      header.append(imagesender_searchBar);

      const body = document.createElement("div");
      body.id = "imagesender_body";
      body.className =
        "scroller-2MALzE list-3V14yy thin-RnSY0a scrollerBase-1Pkza4";
      body.addEventListener("scroll", image_swipe_load);

      panel_content.append(header, body);
      full_UI.append(panel_content);

      //Search bar modifications
      const searchbar_input = imagesender_searchBar.querySelector("input");
      searchbar_input.className = "input-2m5SfJ";
      searchbar_input.placeholder = "Search for images";
      searchbar_input.addEventListener("change", (e) => {
        generateimages(body, e.target.value);
      });
      generateimages(body);
    });

    pickers.append(imagesender_picker);
  }

  ////////////////////////////////////
  /////                          /////
  /////       BD functions       /////
  /////                          /////
  ////////////////////////////////////
  return {
    start: () => {
      _settings = Object.assign(
        {},
        settings_default,
        BdApi.loadData(meta.name, "settings")
      );
      Object.assign(settings, _settings);

      BdApi.injectCSS(
        meta.name,
        `
            .container {
                display: grid;
                grid-template-columns: 30% 60% 10%;
                grid-gap: 2%;
                margin-right: 2%
            }
            .container > button {
                align-self: center;
                justify-self: center;
                width: 40px;
                height: 40px;
            }
            #ImageSender_UI_Button {
                all: unset;
                background: url("https://raw.githubusercontent.com/CriosChan/ImageSender/main/logo.png");
                background-size: cover;
                background-position: center;
                opacity: 70%;
                height: 24px;
                width: 24px;
                cursor: pointer;
                justify-self: center;
                align-self: center;
                margin: 5px;
                margin-right: 10px;
            }
            #ImageSender_UI_Button:hover {
                opacity: 100%;
            }
            #imagesender_body {
                display: block;
                margin-right: 10px;
                height: 100%;
                overflow-x: hidden;
                overflow-y: scroll;
            }

            .imagesender_filecontainer {
              display: grid;
              grid-template-columns: 50% 50%;
              margin-right: 10px;
              height: fit-content;
            }

            #imagesender_message {
              display: grid;
              width: 100%;
              height: 90%;
              margin: 20px;
              text-align: center;
              align-self: center;
              justify-self: center;
            }

            #imagesender_message div {
              justify-self: center;
              width: 100%;
              height: 100%
            }
            .imagesender_buttons {
              width: 95%;
              height: 200px;
              justify-self: center;
              margin: 10px;
              background-size: contain;
              background-color: initial;
              background-repeat: no-repeat;
              background-position: center;
            }

            .imagesender_hide_container {
              margin: 10px;
              height: fit-content;
            }
            `
      );

      check_folders();

      try {
        add_button();
      } catch (error) {
        console.log("Isn't in a channel");
      }
    },
    stop: () => {
      //Delete all textarea buttons in case of multiple
      document.querySelectorAll("#ImageSender_UI_Button").forEach((element) => {
        element.remove();
      });

      try {
        //Full delete UI and scripts
        const tab_button = document.getElementById("imagesender-picker-tab");
        if (!tab_button) return;
        if (!document.getElementById("imagesender-picker-tab-panel"))
          tab_button.remove();
        const picker = document.getElementById(
          "imagesender-picker-tab-panel"
        ).parentElement;
        if (tab_button.className.includes("navButtonActive")) {
          const navButtonActive = Array.from(tab_button.classList)
            .filter((name) => name.includes("navButtonActive"))
            .toString();
          document.getElementById("imagesender-picker-tab-panel").remove();
          picker.lastChild.style.display = null;
          //Re "enable" nav real button
          document.getElementById(
            picker.lastChild.id.replace("-panel", "")
          ).className += " " + navButtonActive;
          tab_button.remove();
        }
        //Path to navbar, remove event
        picker.firstChild.firstChild.childNodes.forEach((element) => {
          element.removeEventListener("click", navbar_button_compatibility);
        });
      } catch {}
      BdApi.clearCSS(meta.name);
      loaded_folders = [];
      document
        .querySelectorAll(".expression-picker-chat-input-button")
        .forEach((node) => {
          node.removeEventListener("click", reactions_picker_event);
        });
    },
    onSwitch: () => {
      //Add button to TextArea
      add_button();
    },
    getSettingsPanel: () => {
      const settingsPanel = document.createElement("div");
      settingsPanel.id = "ImageSender_settingsPanel";
      createSettings(settingsPanel);
      return settingsPanel;
    },
  };
};
