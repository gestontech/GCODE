import React, {useEffect, useMemo, useState} from 'react';
import {
  SafeAreaView, View, Text, Pressable, TextInput, ScrollView,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';

const C = {
  bg:'#070914', panel:'#0d1020', panel2:'#11152a', line:'#242943',
  text:'#f7f8ff', muted:'#8189a6', purple:'#713cff', blue:'#11bff5',
  green:'#5fe0a0', red:'#ff647c'
};

const starterCode = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GCODE</title>
<style>
body{margin:0;background:#090b18;color:white;font-family:system-ui;text-align:center}
main{min-height:100vh;display:grid;place-items:center;padding:24px}
.card{max-width:420px;padding:42px;border-radius:28px;background:#12152a}
.logo{font-size:56px;font-weight:900;background:linear-gradient(90deg,#743cff,#12c5f5);
-webkit-background-clip:text;color:transparent}
button{background:#713cff;color:white;border:0;border-radius:12px;padding:13px 22px}
</style>
</head>
<body><main><section class="card"><div class="logo">G</div>
<h1>Bienvenue sur GCODE</h1><p>Code. Build. Create.</p><button>Commencer</button>
</section></main></body></html>`;

const initialProjects = [
 {id:'1',name:'Portfolio Web',type:'HTML · CSS · JS',code:starterCode},
 {id:'2',name:'Application de livraison',type:'React · Node.js',code:starterCode},
 {id:'3',name:'Mon site pro',type:'Vue · Firebase',code:starterCode}
];

export default function App(){
 const [projects,setProjects]=useState(initialProjects);
 const [tab,setTab]=useState('home');
 const [active,setActive]=useState(null);
 const [view,setView]=useState('files');
 const [search,setSearch]=useState('');
 const [ai,setAi]=useState('');
 const [aiModal,setAiModal]=useState(false);
 const [loaded,setLoaded]=useState(false);

 useEffect(()=>{AsyncStorage.getItem('gcode.projects').then(v=>{if(v)setProjects(JSON.parse(v));setLoaded(true)})},[]);
 useEffect(()=>{if(loaded)AsyncStorage.setItem('gcode.projects',JSON.stringify(projects))},[projects,loaded]);

 const current=projects.find(p=>p.id===active);

 function newProject(name='Nouveau projet'){
   const p={id:Date.now().toString(),name,type:'HTML · CSS · JS',code:starterCode};
   setProjects(x=>[p,...x]);setActive(p.id);setView('editor');setTab('projects');
 }
 function updateCode(v){setProjects(x=>x.map(p=>p.id===active?{...p,code:v}:p))}
 function removeProject(id){Alert.alert('Supprimer le projet','Cette action est irréversible.',[
  {text:'Annuler',style:'cancel'},{text:'Supprimer',style:'destructive',onPress:()=>{setProjects(x=>x.filter(p=>p.id!==id));if(active===id)setActive(null)}}
 ])}

 return <SafeAreaView style={s.safe}>
  <StatusBar style="light"/>
  {!active ? <Home
    tab={tab} setTab={setTab} projects={projects} search={search} setSearch={setSearch}
    newProject={newProject} open={p=>{setActive(p.id);setView('files')}} removeProject={removeProject}
    setAiModal={setAiModal}
  /> :
  <Workspace project={current} view={view} setView={setView} code={current?.code||''}
    updateCode={updateCode} back={()=>setActive(null)} setAiModal={setAiModal}/>
  }
  <Modal visible={aiModal} animationType="slide" transparent>
    <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={s.modalWrap}>
      <View style={s.modal}>
        <View style={s.row}><Text style={s.h2}>✨ GCODE AI</Text><Pressable onPress={()=>setAiModal(false)}><Text style={s.close}>×</Text></Pressable></View>
        <Text style={s.muted}>Décris ce que tu veux créer ou modifier.</Text>
        <TextInput multiline value={ai} onChangeText={setAi} placeholder="Ex : crée une page de connexion moderne..." placeholderTextColor="#626a86" style={s.aiInput}/>
        <View style={s.aiActions}>
          {['Générer','Corriger','Expliquer','Optimiser'].map(x=><Pressable key={x} style={s.chip}><Text style={s.chipText}>{x}</Text></Pressable>)}
        </View>
        <Pressable style={s.primary} onPress={()=>{setAiModal(false);Alert.alert('GCODE AI','La connexion à ton fournisseur IA sera branchée ici.')}}><Text style={s.primaryText}>✨ Envoyer</Text></Pressable>
      </View>
    </KeyboardAvoidingView>
  </Modal>
 </SafeAreaView>
}

function Home({tab,setTab,projects,search,setSearch,newProject,open,removeProject,setAiModal}){
 if(tab==='settings') return <Settings setTab={setTab}/>;
 if(tab==='ai') return <AI setAiModal={setAiModal} setTab={setTab}/>;
 const filtered=projects.filter(p=>p.name.toLowerCase().includes(search.toLowerCase()));
 return <View style={s.screen}>
   <Header/>
   <ScrollView contentContainerStyle={s.content}>
    <Text style={s.eyebrow}>GCODE AI</Text><Text style={s.h1}>Bonjour, Geston 👋</Text><Text style={s.muted}>Que voulez-vous créer aujourd'hui ?</Text>
    <Pressable style={s.idea} onPress={()=>setAiModal(true)}><Text style={s.spark}>✦</Text><View style={{flex:1}}><Text style={s.bold}>Décrivez votre idée</Text><Text style={s.mutedSmall}>Ex : créer une application de livraison</Text></View><Text style={s.arrow}>›</Text></Pressable>
    <Pressable style={s.primary} onPress={()=>setAiModal(true)}><Text style={s.primaryText}>✨ Créer avec l'IA</Text></Pressable>
    <View style={s.quickRow}>
      <Quick t="Nouveau" icon="＋" onPress={()=>newProject()}/><Quick t="Importer" icon="⇧" onPress={()=>Alert.alert('Importer','La sélection ZIP sera branchée avec expo-file-system.')}/>
      <Quick t="GitHub" icon="⌘" onPress={()=>Alert.alert('GitHub','Connexion OAuth à configurer.')}/><Quick t="Extensions" icon="◈" onPress={()=>Alert.alert('Extensions','Marketplace GCODE à venir.')}/>
    </View>
    <View style={s.section}><Text style={s.h2}>Projets récents</Text><Pressable onPress={()=>setTab('projects')}><Text style={s.link}>Tout voir</Text></Pressable></View>
    <View style={s.search}><Text>⌕</Text><TextInput value={search} onChangeText={setSearch} placeholder="Rechercher..." placeholderTextColor="#626a86" style={s.searchInput}/></View>
    {filtered.map(p=><ProjectCard key={p.id} p={p} open={open} remove={removeProject}/>)}
   </ScrollView>
   <Bottom tab={tab} setTab={setTab}/>
 </View>
}

function Quick({t,icon,onPress}){return <Pressable style={s.quick} onPress={onPress}><Text style={s.quickIcon}>{icon}</Text><Text style={s.quickText}>{t}</Text></Pressable>}
function ProjectCard({p,open,remove}){return <Pressable style={s.card} onPress={()=>open(p)} onLongPress={()=>remove(p.id)}>
 <View style={s.projectIcon}><Text style={s.projectIconText}>{p.name[0]}</Text></View><View style={{flex:1}}><Text style={s.bold}>{p.name}</Text><Text style={s.mutedSmall}>{p.type}</Text></View><Text style={s.mutedSmall}>›</Text>
 </Pressable>}

function Workspace({project,view,setView,code,updateCode,back,setAiModal}){
 if(view==='preview')return <Preview code={code} back={back} setView={setView}/>;
 if(view==='terminal')return <Terminal back={back}/>;
 if(view==='git')return <Git back={back}/>;
 return <View style={s.screen}>
   <View style={s.workspaceTop}><Pressable onPress={back}><Text style={s.topIcon}>‹</Text></Pressable><View style={{flex:1}}><Text style={s.bold}>{project.name}</Text><Text style={s.mutedSmall}>{view==='editor'?'index.html':'Projet local'}</Text></View><Pressable onPress={()=>setView('preview')}><Text style={s.topIcon}>▶</Text></Pressable></View>
   {view==='files'?<Files setView={setView}/>:<Editor code={code} updateCode={updateCode} setAiModal={setAiModal}/>}
   <View style={s.toolDock}>
     <Tool t="Fichiers" icon="▣" active={view==='files'} onPress={()=>setView('files')}/><Tool t="Éditeur" icon="{}" active={view==='editor'} onPress={()=>setView('editor')}/>
     <Tool t="Preview" icon="◉" active={view==='preview'} onPress={()=>setView('preview')}/><Tool t="Terminal" icon=">_" onPress={()=>setView('terminal')}/><Tool t="IA" icon="✦" onPress={()=>setAiModal(true)}/>
   </View>
 </View>
}
function Files({setView}){return <ScrollView contentContainerStyle={s.content}><View style={s.search}><Text>⌕</Text><TextInput placeholder="Rechercher un fichier..." placeholderTextColor="#626a86" style={s.searchInput}/></View>{[
 ['📁','src'],['📁','assets'],['📁','components'],['📁','pages'],['📁','styles'],['📄','App.jsx'],['📄','main.jsx'],['📁','public'],['📄','package.json'],['📄','README.md']
].map((x,i)=><Pressable key={i} style={s.fileRow} onPress={()=>x[1].includes('.')&&setView('editor')}><Text>{x[0]}</Text><Text style={{flex:1,color:'#d9ddef'}}>{x[1]}</Text><Text style={s.mutedSmall}>›</Text></Pressable>)}</ScrollView>}
function Editor({code,updateCode,setAiModal}){return <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}><View style={s.editor}><TextInput multiline spellCheck={false} autoCapitalize="none" value={code} onChangeText={updateCode} style={s.code} textAlignVertical="top"/></View><View style={s.codeTools}>{['{}','Tab','←','→','[ ]'].map(x=><Text key={x} style={s.toolText}>{x}</Text>)}<Pressable onPress={setAiModal}><Text style={s.aiTool}>✦ AI</Text></Pressable></View></KeyboardAvoidingView>}
function Preview({code,back,setView}){return <View style={s.screen}><View style={s.workspaceTop}><Pressable onPress={back}><Text style={s.topIcon}>‹</Text></Pressable><Text style={s.bold}>Aperçu</Text><View style={{flex:1}}/><Text style={s.topIcon}>⋮</Text></View><View style={s.previewTabs}><Text style={s.activeTab}>📱 Mobile</Text><Text>Tablet</Text><Text>Desktop</Text></View><WebView source={{html:code}} style={{flex:1,backgroundColor:'#fff'}} originWhitelist={['*']}/><View style={s.previewBottom}><Pressable onPress={()=>setView('files')}><Text style={s.mutedSmall}>↻ Actualiser</Text></Pressable><Pressable onPress={()=>setView('terminal')}><Text style={s.mutedSmall}>⌘ Console</Text></Pressable></View></View>}
function Terminal({back}){return <View style={s.screen}><View style={s.workspaceTop}><Pressable onPress={back}><Text style={s.topIcon}>‹</Text></Pressable><Text style={s.bold}>Terminal</Text></View><View style={s.terminal}><Text style={s.termText}>$ npm install{'\n'}added 142 packages{'\n'}$ npm run dev{'\n'}✓ server ready{'\n'}➜ local: http://localhost:3000{'\n\n'}$ <Text style={{color:C.green}}>▌</Text></Text></View></View>}
function Git({back}){return <View style={s.screen}><View style={s.workspaceTop}><Pressable onPress={back}><Text style={s.topIcon}>‹</Text></Pressable><Text style={s.bold}>Git / GitHub</Text></View><ScrollView contentContainerStyle={s.content}><View style={s.branch}><Text>⌘ main</Text></View>{['index.html','style.css','app.js'].map(x=><View style={s.fileRow} key={x}><Text style={{color:C.green}}>M</Text><Text style={{flex:1}}>{x}</Text><Text style={s.mutedSmall}>changed</Text></View>)}<Pressable style={s.primary}><Text style={s.primaryText}>Commit</Text></Pressable></ScrollView></View>}
function AI({setAiModal,setTab}){return <View style={s.screen}><ScrollView contentContainerStyle={s.content}><Text style={s.eyebrow}>GCODE AI</Text><Text style={s.h1}>Assistant IA</Text>{[['✦','Générer du code'],['◉','Corriger une erreur'],['{}','Expliquer le code'],['⚡','Optimiser le code'],['＋','Ajouter une fonction']].map(x=><Pressable key={x[1]} style={s.aiCard} onPress={()=>setAiModal(true)}><Text style={s.aiIcon}>{x[0]}</Text><View style={{flex:1}}><Text style={s.bold}>{x[1]}</Text><Text style={s.mutedSmall}>Laissez GCODE AI travailler sur votre projet</Text></View><Text>›</Text></Pressable>)}</ScrollView><Bottom tab="ai" setTab={setTab}/></View>}
function Settings({setTab}){return <View style={s.screen}><ScrollView contentContainerStyle={s.content}><Text style={s.h1}>Paramètres</Text>{['Apparence','Éditeur','Couleurs','Taille du texte','Police','Numéros de lignes','Auto-save','Modèle IA','API','Suggestions','Cloud & synchronisation','GitHub'].map((x,i)=><View style={s.setting} key={x}><Text>{x}</Text><Text style={i>4&&i<8?'toggleOn':'mutedSmall'}>{i>4&&i<8?'●':'›'}</Text></View>)}</ScrollView><Bottom tab="settings" setTab={setTab}/></View>}
function Tool({t,icon,onPress,active}){return <Pressable style={s.tool} onPress={onPress}><Text style={[s.toolIcon,active&&{color:C.purple}]}>{icon}</Text><Text style={[s.toolLabel,active&&{color:'#a88bff'}]}>{t}</Text></Pressable>}
function Bottom({tab,setTab}){return <View style={s.bottom}><Tool t="Accueil" icon="⌂" active={tab==='home'} onPress={()=>setTab('home')}/><Tool t="Projets" icon="▣" active={tab==='projects'} onPress={()=>setTab('projects')}/><Tool t="IA" icon="✦" active={tab==='ai'} onPress={()=>setTab('ai')}/><Tool t="Réglages" icon="⚙" active={tab==='settings'} onPress={()=>setTab('settings')}/></View>}
function Header(){return <View style={s.header}><View style={s.logo}><Text style={s.logoText}>G</Text></View><View><Text style={s.logoName}>GCODE</Text><Text style={s.logoSub}>Code. Build. Create.</Text></View><View style={{flex:1}}/><Text style={s.muted}>⌕  ☁  ◯</Text></View>}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},screen:{flex:1,backgroundColor:C.bg},content:{padding:20,paddingBottom:110},
 header:{height:68,paddingHorizontal:18,flexDirection:'row',alignItems:'center',borderBottomWidth:1,borderBottomColor:C.line,backgroundColor:'#080a15'},
 logo:{width:38,height:38,borderRadius:11,backgroundColor:C.purple,alignItems:'center',justifyContent:'center'},logoText:{fontSize:24,fontWeight:'900',color:'#fff'},logoName:{fontSize:15,fontWeight:'800',letterSpacing:1},logoSub:{fontSize:8,color:C.muted},
 eyebrow:{fontSize:10,color:'#9b7cff',letterSpacing:2,fontWeight:'800',marginTop:8},h1:{fontSize:25,fontWeight:'800',color:C.text,marginTop:6,marginBottom:3},h2:{fontSize:16,fontWeight:'800',color:C.text},muted:{color:C.muted,fontSize:12},mutedSmall:{color:'#747c98',fontSize:10},bold:{fontWeight:'700',color:C.text,fontSize:13},
 idea:{marginTop:20,padding:15,borderRadius:16,borderWidth:1,borderColor:'#343a5c',backgroundColor:C.panel,flexDirection:'row',alignItems:'center',gap:12},spark:{fontSize:22,color:'#a17dff'},arrow:{fontSize:23,color:'#68708e'},primary:{marginTop:12,borderRadius:13,padding:14,backgroundColor:C.purple,alignItems:'center'},primaryText:{fontWeight:'800',color:'#fff'},quickRow:{flexDirection:'row',gap:7,marginVertical:18},quick:{flex:1,paddingVertical:12,borderRadius:12,borderWidth:1,borderColor:C.line,backgroundColor:C.panel,alignItems:'center'},quickIcon:{color:'#a27cff',fontSize:18},quickText:{fontSize:9,color:'#aab0c8',marginTop:5},section:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginVertical:10},link:{fontSize:10,color:'#9a7bff'},search:{height:43,borderRadius:11,borderWidth:1,borderColor:C.line,backgroundColor:C.panel,flexDirection:'row',alignItems:'center',paddingHorizontal:12,gap:8,marginBottom:10},searchInput:{flex:1,color:'#fff',fontSize:11},card:{flexDirection:'row',alignItems:'center',gap:12,padding:13,borderRadius:14,borderWidth:1,borderColor:C.line,backgroundColor:C.panel,marginBottom:8},projectIcon:{width:39,height:39,borderRadius:11,backgroundColor:'#171a32',alignItems:'center',justifyContent:'center'},projectIconText:{color:'#68c8ff',fontWeight:'800'},bottom:{height:75,position:'absolute',left:0,right:0,bottom:0,backgroundColor:'#090b17',borderTopWidth:1,borderTopColor:C.line,flexDirection:'row',justifyContent:'space-around',paddingTop:8},tool:{flex:1,alignItems:'center',justifyContent:'center'},toolIcon:{fontSize:18,color:'#6e7694'},toolLabel:{fontSize:8,color:'#6e7694',marginTop:3},workspaceTop:{height:62,paddingHorizontal:13,flexDirection:'row',alignItems:'center',gap:12,borderBottomWidth:1,borderBottomColor:C.line},topIcon:{fontSize:22,color:'#b5bdd8'},fileRow:{height:44,borderBottomWidth:1,borderBottomColor:'#181c30',flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:10},toolDock:{height:68,position:'absolute',left:0,right:0,bottom:0,backgroundColor:'#0b0d19',borderTopWidth:1,borderTopColor:C.line,flexDirection:'row'},editor:{flex:1,backgroundColor:'#080b16'},code:{flex:1,color:'#dbe0f5',fontFamily:Platform.OS==='ios'?'Menlo':'monospace',fontSize:12,lineHeight:19,padding:15},codeTools:{height:48,backgroundColor:'#0d1020',borderTopWidth:1,borderTopColor:C.line,flexDirection:'row',alignItems:'center',gap:22,paddingHorizontal:12},toolText:{fontFamily:'monospace',fontSize:11,color:'#858ca6'},aiTool:{marginLeft:'auto',color:'#a17dff',fontWeight:'800'},previewTabs:{height:45,backgroundColor:'#0d1020',flexDirection:'row',alignItems:'center',justifyContent:'space-around'},previewTabsText:{color:'#777f9d'},activeTab:{color:'#a17dff',fontWeight:'800'},previewBottom:{height:52,backgroundColor:'#0d1020',flexDirection:'row',justifyContent:'space-around',alignItems:'center'},terminal:{flex:1,margin:14,borderRadius:14,borderWidth:1,borderColor:C.line,backgroundColor:'#04060d',padding:16},termText:{fontFamily:Platform.OS==='ios'?'Menlo':'monospace',fontSize:11,lineHeight:20,color:'#b9bfd5'},branch:{padding:13,borderRadius:11,borderWidth:1,borderColor:C.line,backgroundColor:C.panel,marginBottom:10},aiCard:{flexDirection:'row',alignItems:'center',gap:12,padding:15,borderRadius:14,borderWidth:1,borderColor:C.line,backgroundColor:C.panel,marginTop:9},aiIcon:{fontSize:20,color:'#a17cff',width:30},setting:{height:49,borderBottomWidth:1,borderBottomColor:'#1c2033',flexDirection:'row',alignItems:'center',justifyContent:'space-between',fontSize:12,color:C.text},toggleOn:{color:'#7b4cff'},modalWrap:{flex:1,justifyContent:'flex-end',backgroundColor:'#0008'},modal:{backgroundColor:'#11152a',borderTopLeftRadius:24,borderTopRightRadius:24,padding:20,borderTopWidth:1,borderColor:'#343a5c'},row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},close:{fontSize:30,color:'#8a91ac'},aiInput:{height:130,borderRadius:13,borderWidth:1,borderColor:'#303652',backgroundColor:'#090c19',color:'#fff',padding:12,marginTop:15,textAlignVertical:'top',fontSize:12},aiActions:{flexDirection:'row',flexWrap:'wrap',gap:7,marginVertical:12},chip:{paddingHorizontal:10,paddingVertical:7,borderRadius:9,backgroundColor:'#1a1e38',borderWidth:1,borderColor:'#303652'},chipText:{fontSize:9,color:'#b8bddd'}
});
