#!/usr/bin/env ruby
# frozen_string_literal: true

require "date"
require "json"
require "pathname"
require "set"
require "yaml"

ROOT = Pathname.new(__dir__).parent.expand_path
RELEASE = "0.5.0"
failures = []

def relative(path)
  Pathname.new(path).relative_path_from(ROOT).to_s
end

def safe_yaml(path)
  YAML.safe_load(
    File.read(path, encoding: "UTF-8"),
    permitted_classes: [Date, Time],
    aliases: false
  )
end

json_files = Dir[ROOT.join("schemas/**/*.json")].sort
json_documents = {}

json_files.each do |path|
  begin
    document = JSON.parse(File.read(path, encoding: "UTF-8"))
    failures << "#{relative(path)}: top level must be an object" unless document.is_a?(Hash)
    json_documents[path] = document
  rescue JSON::ParserError => error
    failures << "#{relative(path)}: invalid JSON: #{error.message}"
  end
end

yaml_files = (
  Dir[ROOT.join("schemas/examples/*.yaml")] +
  Dir[ROOT.join("skills/*.yaml")] +
  Dir[ROOT.join("tests/*.yaml")]
).sort

yaml_files.each do |path|
  begin
    document = safe_yaml(path)
    failures << "#{relative(path)}: top level must be a mapping" unless document.is_a?(Hash)
  rescue Psych::Exception => error
    failures << "#{relative(path)}: invalid YAML: #{error.message}"
  end
end

Dir[ROOT.join("tests/*.yaml")].sort.each do |path|
  next if File.basename(path).start_with?("manifest-")

  begin
    document = safe_yaml(path)
    next unless document.is_a?(Hash)

    vectors = document["cases"] || document["scenarios"] || document["evals"]
    unless vectors.is_a?(Array) && !vectors.empty? && vectors.all? { |entry| entry.is_a?(Hash) }
      failures << "#{relative(path)}: expected a non-empty cases or scenarios array"
    end

    if File.basename(path).include?("v0.5.0")
      unless document["artifact_status"] == "declared"
        failures << "#{relative(path)}: v0.5 behavioral vectors must declare artifact_status: declared"
      end
      unless document["execution_status"] == "not_executed"
        failures << "#{relative(path)}: v0.5 behavioral vectors must declare execution_status: not_executed"
      end
    end
  rescue Psych::Exception
    # The syntax failure is already reported above.
  end
end

schema_manifest_path = ROOT.join("schemas/v0.5/manifest.json").to_s
schema_manifest = json_documents[schema_manifest_path]
if schema_manifest
  failures << "schemas/v0.5/manifest.json: release must be #{RELEASE}" unless schema_manifest["release"] == RELEASE
  failures << "schemas/v0.5/manifest.json: Chinese release name must be 奠基版本" unless schema_manifest["release_name_zh"] == "奠基版本"
  failures << "schemas/v0.5/manifest.json: legal_entity_implied must be false" unless schema_manifest["legal_entity_implied"] == false
  failures << "schemas/v0.5/manifest.json: canonical field naming must be snake_case" unless schema_manifest["field_naming"] == "snake_case"

  expected_core = %w[
    Mission
    AuthorityGrant
    Evidence
    CognitiveEvent
    DeliberationSession
    LearningRecord
    EvolutionProposal
    CognitiveVersion
  ]
  core = schema_manifest["core_runtime_objects"]
  core_names = core.is_a?(Array) ? core.map { |entry| entry["object"] } : []
  failures << "schemas/v0.5/manifest.json: frozen core object inventory mismatch" unless core_names == expected_core

  (Array(core) + Array(schema_manifest["supporting_objects"])).each do |entry|
    schema_path = ROOT.join("schemas/v0.5", entry["schema"].to_s)
    unless schema_path.file?
      failures << "schemas/v0.5/manifest.json: missing #{entry['schema']}"
      next
    end

    schema = json_documents[schema_path.to_s]
    failures << "#{relative(schema_path)}: schema version must be #{RELEASE}" unless schema && schema["version"] == RELEASE
    failures << "#{relative(schema_path)}: x-go-os-status must match manifest" unless schema && schema["x-go-os-status"] == entry["status"]
  end

  vocabulary = schema_manifest.dig("authority_action_vocabulary", "canonical_actions")
  authority_schema = json_documents[ROOT.join("schemas/v0.5/authority-grant.schema.json").to_s]
  schema_actions = authority_schema&.dig("$defs", "authorityAction", "anyOf", 0, "enum")
  failures << "v0.5 authority action vocabulary differs between manifest and schema" unless vocabulary == schema_actions

  begin
    example = safe_yaml(ROOT.join("schemas/examples/cognitive-loop-v0.5.0.yaml"))
    example_schema_map = {
      "mission" => "mission.schema.json",
      "authority_grant" => "authority-grant.schema.json",
      "evidence" => "evidence.schema.json",
      "cognitive_event" => "cognitive-event.schema.json",
      "deliberation_session" => "deliberation-session.schema.json",
      "learning_record" => "learning-record.schema.json",
      "evolution_proposal" => "evolution-proposal.schema.json"
    }
    example_schema_map.each do |example_key, schema_name|
      instance = example[example_key]
      schema = json_documents[ROOT.join("schemas/v0.5", schema_name).to_s]
      unless instance.is_a?(Hash) && schema.is_a?(Hash)
        failures << "schemas/examples/cognitive-loop-v0.5.0.yaml: missing #{example_key} mapping"
        next
      end
      missing = Array(schema["required"]) - instance.keys
      failures << "schemas/examples/cognitive-loop-v0.5.0.yaml: #{example_key} missing required keys #{missing.join(', ')}" unless missing.empty?
    end
  rescue Psych::Exception
    # The syntax failure is already reported above.
  end
end

skill_manifest_path = ROOT.join("skills/manifest-v0.5.0.yaml")
begin
  skill_manifest = safe_yaml(skill_manifest_path)
  failures << "skills/manifest-v0.5.0.yaml: release must be #{RELEASE}" unless skill_manifest["release"].to_s == RELEASE
  failures << "skills/manifest-v0.5.0.yaml: Chinese release name must be 奠基版本" unless skill_manifest["release_name_zh"] == "奠基版本"

  entries = Array(skill_manifest["skills"])
  discovered_names = Dir[ROOT.join("skills/*/SKILL.md")].map { |path| File.basename(File.dirname(path)) }.sort
  manifest_names = entries.map { |entry| entry["name"] }.sort
  failures << "skills/manifest-v0.5.0.yaml: inventory differs from Skill directories" unless manifest_names == discovered_names

  entries.each do |entry|
    skill_path = ROOT.join("skills", entry["path"].to_s)
    unless skill_path.file?
      failures << "skills/manifest-v0.5.0.yaml: missing #{entry['path']}"
      next
    end

    body = File.read(skill_path, encoding: "UTF-8")
    match = body.match(/\A---\s*\n(.*?)\n---\s*\n/m)
    unless match
      failures << "#{relative(skill_path)}: missing YAML frontmatter"
      next
    end

    begin
      frontmatter = YAML.safe_load(match[1], aliases: false)
      %w[name description version framework status language license].each do |key|
        failures << "#{relative(skill_path)}: missing frontmatter #{key}" unless frontmatter.key?(key)
      end
      failures << "#{relative(skill_path)}: directory/name mismatch" unless frontmatter["name"] == entry["name"]
      failures << "#{relative(skill_path)}: manifest/frontmatter version mismatch" unless frontmatter["version"].to_s == entry["version"].to_s
      failures << "#{relative(skill_path)}: manifest/frontmatter status mismatch" unless frontmatter["status"] == entry["status"]
      failures << "#{relative(skill_path)}: invalid semantic version" unless frontmatter["version"].to_s.match?(/\A\d+\.\d+\.\d+\z/)
    rescue Psych::Exception => error
      failures << "#{relative(skill_path)}: invalid frontmatter YAML: #{error.message}"
    end

    contract_path_value = entry["contract_path"]
    next if contract_path_value.nil?

    contract_path = ROOT.join("skills", contract_path_value)
    unless contract_path.file?
      failures << "skills/manifest-v0.5.0.yaml: missing #{contract_path_value}"
      next
    end

    heading = File.foreach(contract_path, encoding: "UTF-8").first.to_s.strip
    expected_heading = "# Contract v#{entry['contract_version']}"
    failures << "#{relative(contract_path)}: expected heading #{expected_heading.inspect}" unless heading == expected_heading
  end
rescue Psych::Exception => error
  failures << "skills/manifest-v0.5.0.yaml: invalid YAML: #{error.message}"
end

markdown_files = (
  Dir[ROOT.join("schemas/**/*.md")] +
  Dir[ROOT.join("skills/**/*.md")] +
  Dir[ROOT.join("tests/**/*.md")]
).sort

markdown_files.each do |path|
  content = File.read(path, encoding: "UTF-8")
  content.scan(/\[[^\]]*\]\(([^)]+)\)/).flatten.each do |raw_target|
    target = raw_target.strip.gsub(/\A<|>\z/, "").split("#", 2).first
    next if target.empty? || target.match?(/\A(?:https?:|mailto:|chatgpt-conversation:)/)

    resolved = if target.start_with?("/")
                 ROOT.join(target.delete_prefix("/"))
               else
                 Pathname.new(path).dirname.join(target).cleanpath
               end
    failures << "#{relative(path)}: broken local link #{raw_target}" unless resolved.exist?
  end
end

forbidden_chinese_label = "基金会" + "版本"
scan_files = Dir[ROOT.join("{schemas,skills,tests}/**/*")].select { |path| File.file?(path) }
scan_files.each do |path|
  content = File.read(path, encoding: "UTF-8")
  failures << "#{relative(path)}: use 奠基版本, not #{forbidden_chinese_label}" if content.include?(forbidden_chinese_label)
end

if failures.empty?
  puts "PASS: #{json_files.length} JSON files, #{yaml_files.length} YAML files, #{markdown_files.length} Markdown files, and #{Dir[ROOT.join('skills/*/SKILL.md')].length} Skills checked."
  exit 0
end

warn "FAIL: #{failures.length} repository validation issue(s):"
failures.each { |failure| warn "- #{failure}" }
exit 1
