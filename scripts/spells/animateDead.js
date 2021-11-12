import { animateDeadDialog } from "../apps/animte-dead-dialog.js"
import ASESettings from "../apps/aseSettings.js";
import * as utilFunctions from "../utilityFunctions.js";

export class animateDead {
    static registerHooks() {
        if (game.settings.get("advancedspelleffects", "preloadFiles")) {
            //console.log("Starting Preload of ASE Animate Dead...");
            Hooks.on("sequencer.ready", animateDead._preloadAssets);
        }
        return;
    }
    static async _preloadAssets() {
        /* BULK PRELOADER 
        console.log('Preloading assets for ASE Animate Dead...');
        let assetDBPaths = [
            "jb2a.magic_signs.circle.02",
            "jb2a.eldritch_blast",
            "jb2a.energy_strands.complete",
            "jb2a.portals.vertical.vortex",
            "jb2a.impact.010"
        ];
        let assetFilePaths = await utilFunctions.getAssetFilePaths(assetDBPaths);
        //console.log('Files about to be preloaded...', assetDBPaths);
        await Sequencer.Preloader.preloadForClients(assetFilePaths, true);
        console.log(`Preloaded ${assetFilePaths.length} assets!`);
        */
        // iterate over all actors in game.actors and find all items with the ASE Animate Dead effect
        // and preload the assets for the effect 
        console.log('Preloading assets for ASE Animate Dead...');
        let assetDBPaths = [];
        let animateDeadItems = utilFunctions.getAllItemsNamed("Animate Dead");
        if (animateDeadItems.length > 0) {
            animateDeadItems.forEach(async function (item) {
                let aseSettings = item.getFlag("advancedspelleffects", "effectOptions");
                //console.log(aseSettings);

                let portalAnimIntro = `jb2a.magic_signs.circle.02.${aseSettings.magicSchool}.intro.${aseSettings.magicSchoolColor}`;
                let portalAnimLoop = `jb2a.magic_signs.circle.02.${aseSettings.magicSchool}.loop.${aseSettings.magicSchoolColor}`;
                let portalAnimOutro = `jb2a.magic_signs.circle.02.${aseSettings.magicSchool}.outro.${aseSettings.magicSchoolColor}`;
                let effectAAnim = `jb2a.eldritch_blast.${aseSettings.effectAColor}.05ft`;
                let effectBAnim = `jb2a.energy_strands.complete.${aseSettings.effectBColor}.01`;

                if (!assetDBPaths)
                    //Add animation to assetDBPaths if it is not already in the list
                    if (!assetDBPaths.includes(portalAnimIntro)) assetDBPaths.push(portalAnimIntro);
                if (!assetDBPaths.includes(portalAnimLoop)) assetDBPaths.push(portalAnimLoop);
                if (!assetDBPaths.includes(portalAnimOutro)) assetDBPaths.push(portalAnimOutro);
                if (!assetDBPaths.includes(effectAAnim)) assetDBPaths.push(effectAAnim);
                if (!assetDBPaths.includes(effectBAnim)) assetDBPaths.push(effectBAnim);
            });
        }
        //console.log('DB Paths about to be preloaded...', assetDBPaths);
        //console.log('Files about to be preloaded...', assetFilePaths);
        console.log(`Preloaded ${assetDBPaths.length} assets for Animate Dead!`);
        await Sequencer.Preloader.preloadForClients(assetDBPaths, true);
        return;
    }
    static async rise(midiData) {

        const actorD = midiData.actor;
        const tokenD = canvas.tokens.get(midiData.tokenId);
        const itemD = actorD.items.getName(midiData.item.name);
        let aseSettings = itemD.getFlag("advancedspelleffects", "effectOptions");
        const spellLevel = midiData.itemLevel ? Number(midiData.itemLevel) : 3;
        const spellSaveDC = midiData.actor?.data?.data?.attributes?.spelldc ?? 10;
        const raiseLimit = (2 * spellLevel) - 5;

        let corpses = canvas.tokens.placeables.filter(function (target) {
            return target?.actor?.data?.data?.attributes?.hp?.value == 0
                && utilFunctions.measureDistance(utilFunctions.getCenter(tokenD.data), utilFunctions.getCenter(target.data)) <= 10
                && target !== tokenD
        });

        console.log("Detected corpses in range: ", corpses);
        new animateDeadDialog(corpses, { raiseLimit: raiseLimit, effectSettings: aseSettings }).render(true);

    }

    static async getRequiredSettings(currFlags) {
        if (!currFlags) currFlags = {};
        const magicSignsRaw = `jb2a.magic_signs.circle.02`;
        const magicSchoolOptions = utilFunctions.getDBOptions(magicSignsRaw);

        const magicSchoolColorsRaw = `jb2a.magic_signs.circle.02.${currFlags.advancedspelleffects?.effectOptions?.magicSchool ?? 'abjuration'}.intro`;
        const magicSchoolColorOptions = utilFunctions.getDBOptions(magicSchoolColorsRaw);

        const effectAColorsRaw = `jb2a.eldritch_blast`;
        const effectAColorOptions = utilFunctions.getDBOptions(effectAColorsRaw);

        const effectBColorsRaw = `jb2a.energy_strands.complete`;
        const effectBColorOptions = utilFunctions.getDBOptions(effectBColorsRaw);

        const portalColorsRaw = `jb2a.portals.vertical.vortex`;
        const portalColorOptions = utilFunctions.getDBOptions(portalColorsRaw);

        const portalImpactColorsRaw = `jb2a.impact.010`;
        const portalImpactColorOptions = utilFunctions.getDBOptions(portalImpactColorsRaw);
        const summonActorsList = game.folders?.getName("ASE-Summons")?.contents ?? [];
        let summonOptions = {};
        let currentSummonTypes = {};
        summonActorsList.forEach((actor) => {
            summonOptions[actor.id] = actor.name;
        });
        currentSummonTypes = currFlags.summons ?? { Zombie: { name: "", actor: "" }, Skeleton: { name: "", actor: "" } };

        let spellOptions = [];
        let animOptions = [];
        let soundOptions = [];

        spellOptions.push({
            label: game.i18n.localize('ASE.ZombieActorLabel'),
            type: 'dropdown',
            options: summonOptions,
            name: 'flags.advancedspelleffects.effectOptions.summons.zombie.actor',
            flagName: 'summons.zombie.actor',
            flagValue: currFlags.summons?.zombie?.actor ?? '',
        });
        spellOptions.push({
            label: game.i18n.localize('ASE.SkeletonActorLabel'),
            type: 'dropdown',
            options: summonOptions,
            name: 'flags.advancedspelleffects.effectOptions.summons.skeleton.actor',
            flagName: 'summons.skeleton.actor',
            flagValue: currFlags.summons?.skeleton?.actor ?? '',
        });

        animOptions.push({
            label: game.i18n.localize('ASE.MagicSchoolLabel'),
            type: 'dropdown',
            options: magicSchoolOptions,
            name: 'flags.advancedspelleffects.effectOptions.magicSchool',
            flagName: 'magicSchool',
            flagValue: currFlags.magicSchool ?? 'abjuration',
        });
        animOptions.push({
            label: game.i18n.localize('ASE.MagicSchoolColorLabel'),
            type: 'dropdown',
            options: magicSchoolColorOptions,
            name: 'flags.advancedspelleffects.effectOptions.magicSchoolColor',
            flagName: 'magicSchoolColor',
            flagValue: currFlags.magicSchoolColor ?? 'blue',
        });
        soundOptions.push({
            label: game.i18n.localize('ASE.MagicSchoolColorLabel'),
            type: 'fileInput',
            name: 'flags.advancedspelleffects.effectOptions.magicSchoolSound',
            flagName: 'magicSchoolSound',
            flagValue: currFlags.magicSchoolSound ?? '',
        });
        soundOptions.push({
            label: game.i18n.localize('ASE.MagicSchoolIntroSoundDelayLabel'),
            type: 'numberInput',
            name: 'flags.advancedspelleffects.effectOptions.magicSchoolSoundDelay',
            flagName: 'magicSchoolSoundDelay',
            flagValue: currFlags.magicSchoolSoundDelay ?? 0,
        });
        soundOptions.push({
            label: game.i18n.localize('ASE.MagicSchoolIntroSoundVolumeLabel'),
            type: 'rangeInput',
            name: 'flags.advancedspelleffects.effectOptions.magicSchoolVolume',
            flagName: 'magicSchoolVolume',
            flagValue: currFlags.magicSchoolVolume ?? 1,
            min: 0,
            max: 1,
            step: 0.01,
        });
        soundOptions.push({
            label: game.i18n.localize('ASE.MagicSchoolOutroSoundLabel'),
            type: 'fileInput',
            name: 'flags.advancedspelleffects.effectOptions.magicSchoolSoundOutro',
            flagName: 'magicSchoolSoundOutro',
            flagValue: currFlags.magicSchoolSoundOutro ?? '',
        });
        soundOptions.push({
            label: game.i18n.localize('ASE.MagicSchoolOutroSoundDelayLabel'),
            type: 'numberInput',
            name: 'flags.advancedspelleffects.effectOptions.magicSchoolSoundDelayOutro',
            flagName: 'magicSchoolSoundDelayOutro',
            flagValue: currFlags.magicSchoolSoundDelayOutro ?? 0,
        });
        soundOptions.push({
            label: game.i18n.localize('ASE.MagicSchoolOutroSoundVolumeLabel'),
            type: 'rangeInput',
            name: 'flags.advancedspelleffects.effectOptions.magicSchoolVolumeOutro',
            flagName: 'magicSchoolVolumeOutro',
            flagValue: currFlags.magicSchoolVolumeOutro ?? 1,
            min: 0,
            max: 1,
            step: 0.01,
        });

        animOptions.push({
            label: game.i18n.localize('ASE.EffectAColorLabel'),
            type: 'dropdown',
            options: effectAColorOptions,
            name: 'flags.advancedspelleffects.effectOptions.effectAColor',
            flagName: 'effectAColor',
            flagValue: currFlags.effectAColor ?? 'blue',
        });
        soundOptions.push({
            label: game.i18n.localize('ASE.EffectASoundLabel'),
            type: 'fileInput',
            name: 'flags.advancedspelleffects.effectOptions.effectASound',
            flagName: 'effectASound',
            flagValue: currFlags.effectASound ?? '',
        });
        soundOptions.push({
            label: game.i18n.localize('ASE.EffectASoundDelayLabel'),
            type: 'numberInput',
            name: 'flags.advancedspelleffects.effectOptions.effectASoundDelay',
            flagName: 'effectASoundDelay',
            flagValue: currFlags.effectASoundDelay ?? 0,
        });
        soundOptions.push({
            label: game.i18n.localize('ASE.EffectASoundVolumeLabel'),
            type: 'rangeInput',
            name: 'flags.advancedspelleffects.effectOptions.effectASoundVolume',
            flagName: 'effectASoundVolume',
            flagValue: currFlags.effectASoundVolume ?? 1,
            min: 0,
            max: 1,
            step: 0.01,
        });

        animOptions.push({
            label: game.i18n.localize('ASE.EffectBColorLabel'),
            type: 'dropdown',
            options: effectBColorOptions,
            name: 'flags.advancedspelleffects.effectOptions.effectBColor',
            flagName: 'effectBColor',
            flagValue: currFlags.effectBColor ?? 'blue',
        });
        soundOptions.push({
            label: game.i18n.localize('ASE.EffectBSoundLabel'),
            type: 'fileInput',
            name: 'flags.advancedspelleffects.effectOptions.effectBSound',
            flagName: 'effectBSound',
            flagValue: currFlags.effectBSound ?? '',
        });
        soundOptions.push({
            label: game.i18n.localize('ASE.EffectBSoundDelayLabel'),
            type: 'numberInput',
            name: 'flags.advancedspelleffects.effectOptions.effectBSoundDelay',
            flagName: 'effectBSoundDelay',
            flagValue: currFlags.effectBSoundDelay ?? 0,
        });
        soundOptions.push({
            label: game.i18n.localize('ASE.EffectBSoundVolumeLabel'),
            type: 'rangeInput',
            name: 'flags.advancedspelleffects.effectOptions.effectBSoundVolume',
            flagName: 'effectBSoundVolume',
            flagValue: currFlags.effectBSoundVolume ?? 1,
            min: 0,
            max: 1,
            step: 0.01,
        });

        return {
            animOptions: animOptions,
            spellOptions: spellOptions,
            soundOptions: soundOptions,
        }

    }

}