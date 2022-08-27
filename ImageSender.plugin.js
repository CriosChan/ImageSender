/**
 * @name ImageSender
 * @author CriosChan
 * @authorLink https://github.com/CriosChan/
 * @description This plugin allows you to easily send an image from your PC, like memes for example!
 * @version 0.0.6
 * @invite R7vuNSv
 * @authorid 328191996579545088
 * @updateUrl https://raw.githubusercontent.com/CriosChan/ImageSender/main/ImageSender.plugin.js
 * @website https://github.com/CriosChan/
 * @source https://github.com/CriosChan/ImageSender
 */

 const fs = require('fs');
 const path = require("path");

 module.exports = (() => {
 
 const config = {
     info:{
         name:"ImageSender",
         authors:[{
             name:"CriosChan",
             discord_id:"328191996579545088",
             github_username:"CriosChan",
         }],
         version:"0.0.6",
         description:"This plugin allows you to easily send an image from your PC, like memes for example!",
         github:"https://github.com/CriosChan/ImageSender",
         github_raw:"https://raw.githubusercontent.com/CriosChan/ImageSender/main/ImageSender.plugin.js"
     },
     defaultConfig:
     [
        {
            type: "textbox",
            name: "Images Folders Paths : (separate by comma ; exemple : \"Path , OtherPath \")",
            id: "folder",
            value: ""
        },
        {
            type: "switch",
			name: "Use subfolders ?",
			note: "Allows you to search in the subfolders. ⚠️ The more subfolders your folder has the more likely you are to lag. 🛑High risk of crashing if you have a lot of subfolders",
			id: "subfolders",
            disabled: true,
			value: false
        },
        {
            type: "switch",
			name: "Nitro User ?",
			note: "Allows you to send larger files. Files that are too big are not shown in the interface.",
			id: "nitro",
			value: false
        },
        {
            type: "switch",
            name: "Quit after sending?",
            note: "Will make the interface close each time you send an image.",
            id: "quit_after_send",
            value: false
        }
     ],
     changelog: [
         {
             title: "Refresh button",
             type: "added",
             items: [
                 "This button allows you to reload the folders you have entered, to retrieve new images if you have added any",
             ]
         },
         {
            title: "New way to leave the interface",
            type: "added",
            items: [
                "Just click next to the interface to leave it.",
            ]
        },
        {
           title: "Do you want the interface to close after sending?",
           type: "added",
           items: [
               "It's possible now, you just have to activate it in the plugin settings and the interface will close automatically after sending an image!",
           ]
       }
     ],
     main: "index.js"
 };
 
 return !global.ZeresPluginLibrary ? class {
     constructor() { this._config = config; }
 
     getName = () => config.info.name;
     getAuthor = () => config.info.description;
     getVersion = () => config.info.version;
 
     load()
     {
         BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
             confirmText: "Download Now",
             cancelText: "Cancel",
             onConfirm: () =>
             {
                 require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (err, res, body) =>
                 {
                     if (err) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
                     await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                 });
             }
         });
     }
 
     start() { }
     stop() { }
 } : (([Plugin, Api]) => {
     
     const plugin = (Plugin, Api) =>
     {
         const buttonHTML = `<div class="buttonContainer-2lnNiN da-buttonContainer imagesender">
         <button aria-label="ImageSender" tabindex="0" type="button" class="buttonWrapper-1ZmCpA da-buttonWrapper button-3BaQ4X button-f2h6uQ lookBlank-21BCro colorBrand-I6CyqQ grow-2sR_-F noFocus-2C7BQj da-noFocus">
             <div class="contents-18-Yxp da-contents button-3AYNKb da-button button-318s1X da-button" style="background: url('https://raw.githubusercontent.com/CriosChan/ImageSender/main/logo.png'); width: 30px; height: 30px; background-size: cover; background-position: center">
             </div>
         </button>
     </div>`;
  
         const {DiscordSelectors, PluginUtilities, DOMTools, Toasts, DiscordModules: { UserStore: { getCurrentUser } }} = Api;

         let images = []
         let folders = []
         return class ImageSender extends Plugin {
             constructor()
             {
                 super();
             }
             
             async showChangelog(footer)
             {
                 try { footer = (await WebpackModules.getByProps("getUser", "acceptAgreements").getUser("328191996579545088")).tag + " | https://discord.gg/R7vuNSv"; }
                 finally { super.showChangelog(footer); }
             }
                             
             getDataName = () => this.getName() + "." + getCurrentUser().id;
             loadSettings = s => PluginUtilities.loadSettings(this.getDataName(), PluginUtilities.loadSettings(this.getName(), s || this.defaultSettings));
             saveSettings = s => PluginUtilities.saveSettings(this.getDataName(), this.settings || s);
             
             getSettingsPanel() {
                 const panel = this.buildSettingsPanel();
                         
                 panel.addListener(() => {
                     this.term();
                     this.init();
                 });
 
                 return panel.getElement();
             }
 
             onStart = () => this.init();
             onStop = () => this.term();
 
             init()
             {
                 const form = document.querySelector("form");
                 if (form) this.addButton();

                 let folder = this.settings.folder

                if(folder != ''){
                    Toasts.show("[ImageSender] We scan the proposed folders...")
                    if(folder.includes(',')){
                        let folders = folder.split(',')
                        folders.forEach(folder => {
                            this.read(folder)
                        })
                    } else this.read(folder)                        
                } else {
                    Toasts.show("[ImageSender] Please go to settings and set a path", { type: "error" })
                }
             }
 
             term()
             {
                 const button = document.querySelector(".imagesender");
                 if (button) button.remove();
                 if(document.getElementById("imagesendersendpanel") != null){
                     document.getElementById("imagesendersendpanel").remove()
                 }
                 PluginUtilities.removeStyle(this.getName());
                 images = []
                 folders = []
             }
 
             createbuttons(img, filename, foldername, needfolder){
                 const buttonhtml = `<div class="buttonContainer-28fw2U da-buttonContainer imagesenderSub" style='display: grid; grid-template-columns: auto; width: 150px; height: auto;' id="imagebuttons">
                                    
                                 <button style="background: url(${img}); width: 150px; height: 150px; background-size: contain; margin-bottom: 15px; background-position: center; background-repeat: no-repeat" aria-label="HugButtonHTML" tabindex="0" type="button" class="buttonWrapper-1ZmCpA da-buttonWrapper button-3BaQ4X button-f2h6uQ lookBlank-21BCro colorBrand-I6CyqQ grow-2sR_-F noFocus-2C7BQj da-noFocus">
                                 </button>
                                 <div class="contents-18-Yxp da-contents button-3AYNKb da-button button-318s1X da-button" style="color: white; font-size: 15px; text-align: center; width: 150px; height: auto">
                                 ${filename}    
                                 </div>
                         </div>`;
                     const imagebutton = DOMTools.createElement(buttonhtml);
                     if(needfolder){
                        document.getElementById(foldername).append(imagebutton);
                     } else {
                        document.getElementById("Results").append(imagebutton);
                     }
                     return imagebutton;
             }

             createfilecategory(foldername){
                const folderhtml = `<details open><summary>${foldername} :</summary><div id="${foldername}" class="plugin-inputs collapsible" style="display: grid; height: 100%; width: 100%; grid-template-columns: auto auto auto auto; grid-gap: 20px; margin-top: 22px">
                </div></details>`;
                document.getElementById("mainimagesender").insertAdjacentHTML('beforeEnd', folderhtml)
             }
             
             addButton() {
                 const form = document.querySelector("form");
                 if (form.querySelector(".imagesender")) return;
                 const button = DOMTools.createElement(buttonHTML);
                 form.querySelector(DiscordSelectors.Textarea.buttons).append(button);
                 button.addEventListener("click", () => {
                     this.createInterface()
                 })
             }


             createInterface(){
                const html = `<div class="layerContainer-2v_Sit" id="imagesendersendpanel">
                                 <div class="layer-1Ixpg3">
                                 <div class="backdrop-2ByYRN withLayer-2VVmpp" style="opacity: 0.85; background: hsl(0, calc(var(--saturation-factor, 1) * 0%), 0%);" id="image_sender_backdrop"></div>
                                     <div class="focusLock-2tveLW" role="dialog" aria-labelledby="uid_714" tabindex="-1" aria-modal="true">
                                         <div class="root-g14mjS small-23Atuv fullscreenOnMobile-ixj0e3" style="opacity: 1; transform: scale(1); width: 800px;">
                                             <div class="flex-2S1XBF flex-3BkGQD horizontal-112GEH horizontal-1Piu5- flex-3BkGQD directionRow-2Iu2A9 justifyStart-2Mwniq alignCenter-14kD11 noWrap-hBpHBz header-1zd7se" id="title_bar" style="flex: 0 0 auto;">
                                                 <h2 class="wrapper-1HSdhi fontDisplay-3Gtuks base-21yXnu size20-9iTTnl" style="color:white;font-size:24px">Image Sender </h2>
                                                 <img src="https://raw.githubusercontent.com/CriosChan/ImageSender/main/logo.png" style="width: 40px; height: 40px; margin-left: 15px"/>
                                             </div>
                                             <div class="flex-2S1XBF flex-3BkGQD horizontal-112GEH horizontal-1Piu5- flex-3BkGQD directionRow-2Iu2A9 justifyStart-2Mwniq alignCenter-14kD11 noWrap-hBpHBz header-1zd7se" id="search_bar_image" style="display: block">
                                                <h2 class="wrapper-1HSdhi fontDisplay-3Gtuks base-21yXnu size20-9iTTnl" style="color:white;font-size:18px;margin-bottom: 15px"> Search Bar :</h2>
                                             </div>
                                             <div class="content-2hZxGK content-26qlhD thin-31rlnD scrollerBase-_bVAAt" dir="ltr" style="overflow: hidden scroll; padding-right: 8px;">
                                                 <div class="markdown-19oyJN">
                                                     <div class="paragraph-9M861H" id='imagesenderButtons'>
                                                         <div class="flex-2S1XBF flex-3BkGQD horizontal-112GEH horizontal-1Piu5- flex-3BkGQD directionRow-2Iu2A9 justifyStart-2Mwniq alignCenter-14kD11 noWrap-hBpHBz header-1zd7se" id="mainimagesender" style="display: block; color: white; font-size: 25px;">
                                                             
                                                         </div>
                                                     </div>
                                                 </div>
                                                 <div aria-hidden="true" style="position: absolute; pointer-events: none; min-height: 0px; min-width: 1px; flex: 0 0 auto; height: 20px;"></div>
                                             </div>
                                             <div id="closebutton" class="flex-2S1XBF flex-3BkGQD horizontalReverse-60Katr horizontalReverse-2QssvL flex-3BkGQD directionRowReverse-HZatnx justifyStart-2Mwniq alignStretch-Uwowzr noWrap-hBpHBz footer-31IekZ" style="flex: 0 0 auto;">
                                             
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                             `;
                     document.querySelector("#app-mount").insertAdjacentHTML('beforeEnd', html);
                     const closebutton = DOMTools.createElement(`<button type="submit" class="button-f2h6uQ lookFilled-yCfaCM colorRed-rQXKgM sizeMedium-2bFIHr grow-2sR_-F"><div class="contents-3ca1mk">Close</div></button>`)
                     document.getElementById("closebutton").append(closebutton)
                     closebutton.addEventListener("click", () => {
                         document.getElementById("imagesendersendpanel").remove()
                     })

                     document.getElementById("image_sender_backdrop").addEventListener("click", () => {
                        document.getElementById("imagesendersendpanel").remove()
                     })

                     const input = DOMTools.createElement(`<input class="inputDefault-3FGxgL input-2g-os5" title="Search for image" placeholder="" name="" maxlength="999" aria-labelledby="uid_98668" value="" id="search_bar_image_input"/>`)
     
                     document.getElementById("search_bar_image").append(input)

                     document.getElementById("search_bar_image_input").addEventListener("change", () => {
                        let value = document.getElementById("search_bar_image_input").value
                        if(value == ''){
                            document.getElementById("mainimagesender").innerHTML = '';

                            this.create(folders, images, true)
                        } else {
                            document.getElementById("mainimagesender").innerHTML = '';
                            let newimages = []
                            var loop = new Promise((resolve, reject) => {
                                images.forEach((image, index, array) => {
                                    console.log("launch")
                                    if(image.filename.includes(value)){
                                        newimages.push(image)
                                    }
                                    if (index === array.length -1) resolve()
                                });
                            });
                            loop.then(() => {
                                this.createfilecategory("Results")
                                if(newimages.length == 0){
                                    document.getElementById("Results").append("No Results")
                                }
                                this.create([], newimages, false)
                            })
                        }
                    });

                    const reload_button_and_signal = DOMTools.createElement(`<div style="margin-left: auto; margin-right: 0; display: inline-block; vertical-align: middle">
                        <button id="reload_button" style="background: url(https://raw.githubusercontent.com/CriosChan/ImageSender/main/reload.png); width: 30px; height: 30px; background-size: contain; background-position: center; background-repeat: no-repeat; display: inline-block; vertical-align: middle"" aria-label="HugButtonHTML" tabindex="0" type="button" class="buttonWrapper-1ZmCpA da-buttonWrapper button-3BaQ4X button-f2h6uQ lookBlank-21BCro colorBrand-I6CyqQ grow-2sR_-F noFocus-2C7BQj da-noFocus"></button>
                    </div>`)

                    document.getElementById("title_bar").append(reload_button_and_signal)
                    document.getElementById("reload_button").addEventListener("click", () => {
                        const button = document.querySelector(".imagesender");
                        if (button) button.remove();
                        if(document.getElementById("imagesendersendpanel") != null){
                            document.getElementById("imagesendersendpanel").remove()
                        }
                        images = []
                        folders = []

                        this.init()
                    })

                    document.getElementById("mainimagesender").innerHTML = '';

                    this.create(folders, images, true)
             }

             async read(folder){
                if(folder.slice(-1) == ' '){
                    folder = folder.slice(0, -1)
                }
                if(folder.slice(0,1) == ' ') folder = folder.slice(1)

                const folderName = path.basename(folder).toLowerCase().replace(/ /g, "")
                fs.promises.readdir(folder, async (err, filenames) => {
                    if (err) {
                        Toasts.show("[ImageSender] Failed to load folder named '" + folderName + "'!", { type: "error" });

                        return console.error(err);
                    }

                    folders.push(folderName)

                    for (let filename of filenames) {
                        const fp = path.join(folder, filename);
                        const stats = fs.statSync(fp)
                        if(this.settings.subfolders && stats.isDirectory()){
                            this.read(folder + "\\" + filename)
                        }

                        const ext = filename.split(".")[filename.split(".").length - 1];

                        if (!filename.includes(".") || !["jpg", "jpeg", "png", "gif", "bmp", "webp", "JPG", "JPEG", "PNG", "GIF", "BMP", "WEBP"].includes(ext))
                            continue;

                        const fileSizeInBytes = stats.size;
                        const fileSizeInMegabytes = fileSizeInBytes / (1024*1000);

                        //log(fileSizeInBytes, "log")

                        if(fileSizeInMegabytes > 8 && !this.settings.nitro) continue;
                        if(fileSizeInMegabytes > 100 && this.settings.nitro) continue;

                        const data = await new Promise(r => fs.readFile(fp, "base64", (_, d) => r(d)));

                        images.push({
                            data: "data:image/" + ext + ";base64," + data,
                            filename: filename,
                            foldername: folderName
                        })
                    }

                    Toasts.show("[ImageSender] " + folderName + " has been successfully loaded")
                });
                console.log("finish")
             }

             create(foldertogenerate, imagetogenerate, createfolder){
                if(createfolder){
                    foldertogenerate.forEach(folder => {
                        this.createfilecategory(folder)
                    })
                }

                imagetogenerate.forEach(image => {
                    this.createbuttons(image.data, image.filename, image.foldername, createfolder).addEventListener("click", () => {
                        this.send(image.data, image.filename)
                    });
                });

             }
 
             send(data, filename){
                let channelID = BdApi.findModuleByProps("getLastSelectedChannelId").getChannelId();
                BdApi.findModuleByProps("upload", "instantBatchUpload").upload({
                    channelId: channelID,
                    file: this.dataURLtoFile(data, filename),
                    draftType: 0,
                    message: {
                        "channelId": channelID,
                        "content": "",
                        "tts": false,
                        "invalidEmojis": [],
                        "validNonShortcutEmojis": []
                    },
                    hasSpoiler: false,
                    filename: filename,
                })
                if(this.settings.quit_after_send){
                    document.getElementById("imagesendersendpanel").remove()
                }
            }
            dataURLtoFile(dataurl, filename) {
                var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
                    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
                while(n--){
                    u8arr[n] = bstr.charCodeAt(n);
                }
                return new File([u8arr], filename, {type:mime});
            }
                 
             observer(e) {
                 if (!e.addedNodes.length || !e.addedNodes[0] || !e.addedNodes[0].querySelector) return;
                 const form = e.addedNodes[0].querySelector(DiscordSelectors.Textarea.inner);
                 if (form) this.addButton(form);
             }
 
         };
     };
     return plugin(Plugin, Api);
 })(global.ZeresPluginLibrary.buildPlugin(config));
 })();