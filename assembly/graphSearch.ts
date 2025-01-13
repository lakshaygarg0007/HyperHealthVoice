import { neo4j } from "@hypermode/modus-sdk-as"
import { JSON } from "json-as"
import { embed } from "./generateEmbeddings";

export * from "./generateEmbeddings";

const hostName: string = "neo4j"

@json
class Patient {
  Id: string; // Unique identifier
  name: string; // Patient's name
  age: i32; // Patient's age,
  contactNumber: string;

  constructor(
    Id: string,
    name: string,
    age: i32,
    contactNumber: string
  ) {
    this.Id = Id;
    this.name = name;
    this.age = age;
    this.contactNumber = contactNumber
  }
}

@json
class Reports {
  reportId: string;
  patientId: string;
  reportTitle: string;
  reportDate: string; // Date of report (use string in ISO 8601 format)

  constructor(
    reportId: string,
    patientId: string,
    reportTitle: string,
    reportDate: string,
  ) {
    this.reportId = reportId;
    this.patientId = patientId;
    this.reportTitle = reportTitle;
    this.reportDate =  reportDate != "" ? reportDate : Date.now.toString();
  }
}

@json
class Embeddings {
  reportId: string;
  reportChunk: string;
  reportEmbeddings: Array<f32> | null;

  constructor(
    reportId: string,
    reportChunk: string,
    reportEmbeddings: Array<f32> | null = null
  ) {
    this.reportId = reportId;
    this.reportChunk = reportChunk;
    this.reportEmbeddings = reportEmbeddings;
  }
}

@json
class SimliarChunks {
  reportChunk: string;

  constructor(
    reportChunk: string,
  ) {
    this.reportChunk = reportChunk;
  }
}




export function GetPatientsList(): Patient[] {
  const query = `
    MATCH (p:Patient) RETURN p `
  
  const result = neo4j.executeQuery(hostName, query)

  const patientNodes: Patient[] = []

  for (let i = 0; i < result.Records.length; i++) {
    const record = result.Records[i]
    const node = record.getValue<neo4j.Node>("p")
    const patient = new Patient(
      node.ElementId,
      node.getProperty<string>("name"),
      node.getProperty<i32>("age"),
      '9914087195',
    )
    patientNodes.push(patient)
  }

  return patientNodes
}


export function GetReportsList(patientId: string): Reports[] {
  const vars = new neo4j.Variables();
  vars.set("patientId", patientId);

  const query = `
    MATCH (r:Report) 
    WHERE r.patientId = $patientId 
    RETURN r
  `;

  const result = neo4j.executeQuery(hostName, query, vars);

  const reportNodes: Reports[] = [];

  for (let i = 0; i < result.Records.length; i++) {
    const record = result.Records[i];
    const node = record.getValue<neo4j.Node>("r");

    const report = new Reports(
      node.ElementId,
      node.getProperty<string>("patientId"),
      node.getProperty<string>("reportTitle"),
      node.getProperty<string>("reportDate")
    );
    reportNodes.push(report);
  }

  return reportNodes;
}


  function getId(output: string): string {
    const idKey = '"Id":';
    const idStartIndex = output.indexOf(idKey) + idKey.length;
    const idEndIndex = output.indexOf(',', idStartIndex);
    const patientId = output.substring(idStartIndex, idEndIndex).trim();
    return patientId
  }

  export function StorePatientData(patientName: string, patientAge: i32, contactNumber: string): string {
    const query = `
      CREATE (p:Patient { 
        name: $name, 
        age: $age,
        contactNumber: $contactNumber
      })
      RETURN p
    `;
  
    const vars = new neo4j.Variables();
    vars.set("name", patientName);
    vars.set("age", patientAge);
    vars.set("contactNumber", contactNumber);
  
    const result = neo4j.executeQuery(hostName, query, vars);
    const result1 = result.Records[0].Values[0]
    const patientId = getId(result1)
    console.log(patientId)
    return result1
  }
  

  export function storePatientReport(patientId: string, reportTitle: string, reportChunks: string[]): string {
    const query = `
      CREATE (r:Report { 
        patientId: $patientId,
        reportTitle: $reportTitle, 
        reportDate: $reportDate 
      })
      RETURN r
    `;
  
    const vars = new neo4j.Variables();
    vars.set("patientId", patientId);
    vars.set("reportTitle", reportTitle);
    vars.set("reportDate", Date.now());
  
    const result = neo4j.executeQuery(hostName, query, vars);
    const result1 = result.Records[0].Values[0]
    const reportId = getId(result1)
    generateEmbeddingAndStore(reportId, reportChunks)
    return reportId;
  }
  


  export function generateEmbeddingAndStore(reportId: string, reportChunks: string[]): string {
    for(let i = 0; i < reportChunks.length; i= i +1) {
      const embeddings: f32[][] = embed(reportChunks);
      const query = `
      CREATE (e:Embedding { 
        reportId: $reportId,
        reportChunk: $reportChunk, 
        embeddings: $embeddings 
      })
      RETURN e
      `;

      const vars = new neo4j.Variables();
      vars.set("reportId", reportId);
      vars.set("reportChunk", reportChunks[i]);
      vars.set("embeddings", embeddings[0]);

      const result = neo4j.executeQuery(hostName, query, vars);
    }

    const indexQuery =
    "CREATE VECTOR INDEX `embedding-index` IF NOT EXISTS FOR (e:Embedding) ON (e.embeddings)";

    neo4j.executeQuery(hostName, indexQuery);

    return 'Success'
  }
  

 
  export function performVectorSearch(doctorQueryEmbedding: string[]): SimliarChunks[] {
    const vars = new neo4j.Variables();
    const queryEmbeddings: f32[] = embed([doctorQueryEmbedding[0]])[0];
    vars.set("nums", 2);
    vars.set("queryEmbeddings", queryEmbeddings);

    
    const searchQuery = `
    MATCH (e:Embedding)
    CALL db.index.vector.queryNodes('embedding-index',$nums , $queryEmbeddings)
    YIELD node AS matchedChunk, score
    RETURN matchedChunk, score
    ORDER BY score DESC
    LIMIT 2
    `;
  
    const results = neo4j.executeQuery(hostName, searchQuery, vars);

    const reportNodes: SimliarChunks[] = [];


    for (let i = 0; i < results.Records.length; i++) {
      const record = results.Records[i];
      const node = record.getValue<neo4j.Node>("matchedChunk");
  
      const chunks = new SimliarChunks(
        node.getProperty<string>("reportChunk")
      );
      reportNodes.push(chunks);
    }

    return reportNodes;
  }
  

  
  